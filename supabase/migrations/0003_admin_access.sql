-- =============================================================================
-- Mezgab - 0003_admin_access
-- =============================================================================
-- Administrative roles, payment verification and access gating.
--
-- A new account stays locked (payment_status = 'none') until an administrator
-- reviews the submitted receipt and approves it. Administrators are identified
-- by profiles.role = 'admin' (and/or the ADMIN_EMAILS env var on the server).
--
-- Run AFTER 0001 and 0002. Safe to re-run: every statement is idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: role + payment / access state
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email text,
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin')),
  add column if not exists payment_status text not null default 'none'
    check (payment_status in ('none', 'pending', 'approved', 'rejected')),
  add column if not exists access_revoked boolean not null default false,
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists payment_reviewed_at timestamptz,
  add column if not exists payment_review_note text,
  add column if not exists approved_until timestamptz;

-- Backfill emails from auth for accounts created before this migration.
update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id
    and p.email is distinct from u.email;

create index if not exists idx_profiles_payment_status
  on public.profiles (payment_status, created_at desc);

-- -----------------------------------------------------------------------------
-- payment_submissions - one row per submitted receipt / transaction number
-- -----------------------------------------------------------------------------
create table if not exists public.payment_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  proof_type    text not null check (proof_type in ('image', 'transaction')),
  proof_text    text check (proof_text is null
                   or length(trim(proof_text)) between 3 and 120),
  proof_image   text check (proof_image is null or length(proof_image) <= 2000000),
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  reviewed_by   uuid references auth.users (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint payment_proof_present check (
    (proof_type = 'image' and proof_image is not null)
    or (proof_type = 'transaction' and proof_text is not null)
  )
);

create index if not exists idx_payment_submissions_user
  on public.payment_submissions (user_id, created_at desc);
create index if not exists idx_payment_submissions_status
  on public.payment_submissions (status, created_at desc);

drop trigger if exists trg_payment_submissions_updated_at on public.payment_submissions;
create trigger trg_payment_submissions_updated_at
  before update on public.payment_submissions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- is_admin(): used by RLS policies. SECURITY DEFINER avoids policy recursion.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and access_revoked = false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- guard_profiles(): users may update their own profile, but they must never be
-- able to grant themselves admin, payment approval or an extended access
-- period. The service-role client (server admin API) bypasses these rules.
-- -----------------------------------------------------------------------------
create or replace function public.guard_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text := coalesce(current_setting('role', true), '');
  v_claims text := coalesce(current_setting('request.jwt.claims', true), '');
begin
  -- Server-side contexts (service role, direct SQL / migrations) are trusted.
  if v_role = 'service_role' or v_claims like '%"role"%"service_role"%'
     or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     or auth.uid() is null then
    return new;
  end if;

  -- Administrators may change anything on anyone.
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only administrators can change roles';
  end if;

  if new.approved_until is distinct from old.approved_until
     or new.access_revoked is distinct from old.access_revoked then
    raise exception 'Only administrators can change access periods';
  end if;

  if new.payment_status is distinct from old.payment_status
     and not (
       new.payment_status = 'pending'
       and old.payment_status in ('none', 'rejected')
     ) then
    raise exception 'Only administrators can change payment status';
  end if;

  if new.payment_review_note is distinct from old.payment_review_note
     and coalesce(new.payment_review_note, '') <> '' then
    raise exception 'Only administrators can add review notes';
  end if;

  if new.payment_reviewed_at is distinct from old.payment_reviewed_at then
    raise exception 'Only administrators can change review timestamps';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profiles();

-- -----------------------------------------------------------------------------
-- profiles RLS: admins can read everyone and change roles / access.
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- payment_submissions RLS: users see and submit only their own; admins see all.
-- Users have no UPDATE policy, so a submission can never be self-approved.
-- -----------------------------------------------------------------------------
alter table public.payment_submissions enable row level security;

drop policy if exists "payment_submissions_select_own" on public.payment_submissions;
create policy "payment_submissions_select_own" on public.payment_submissions
  for select using (auth.uid() = user_id);

drop policy if exists "payment_submissions_insert_own" on public.payment_submissions;
create policy "payment_submissions_insert_own" on public.payment_submissions
  for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "payment_submissions_select_admin" on public.payment_submissions;
create policy "payment_submissions_select_admin" on public.payment_submissions
  for select using (public.is_admin());

drop policy if exists "payment_submissions_update_admin" on public.payment_submissions;
create policy "payment_submissions_update_admin" on public.payment_submissions
  for update using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Keep profiles.email in sync when an account is created or its address changes.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Backfill for accounts created before the email column existed.
update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id
    and p.email is distinct from u.email;

-- -----------------------------------------------------------------------------
-- Promote the first administrator (run once, edit the address, then delete).
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- Or set ADMIN_EMAILS in server/.env and let the API promote on first login.
-- -----------------------------------------------------------------------------
