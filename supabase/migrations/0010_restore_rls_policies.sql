-- =============================================================================
-- Mezgab - 0010_restore_rls_policies
-- =============================================================================
-- Restores (and hardens) every Row Level Security policy for the user-owned
-- tables.
--
-- Why this exists: re-running 0001_init_schema.sql drops and recreates the
-- `tasks`, `categories`, `reports` and `notes` tables (`drop table ... cascade`),
-- which silently removes their RLS policies. With RLS enabled and no policy the
-- table becomes default-deny, so every write fails with:
--
--   new row violates row-level security policy for table "tasks"
--
-- This migration is idempotent - it drops and re-creates each policy, so it is
-- safe to run at any time. Run it AFTER any re-run of 0001.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_admin(): helper used by the admin policies (kept in sync with 0003).
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
-- profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "reports_update_own" on public.reports;
create policy "reports_update_own" on public.reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.reports;
create policy "reports_delete_own" on public.reports
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- notes (personal diary)
-- -----------------------------------------------------------------------------
alter table public.notes enable row level security;

drop policy if exists "notes owner select" on public.notes;
create policy "notes owner select" on public.notes
  for select using (auth.uid() = user_id);

drop policy if exists "notes owner insert" on public.notes;
create policy "notes owner insert" on public.notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "notes owner update" on public.notes;
create policy "notes owner update" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes owner delete" on public.notes;
create policy "notes owner delete" on public.notes
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- payment_submissions
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
