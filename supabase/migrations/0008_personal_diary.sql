-- =============================================================================
-- Mezgab - 0008_personal_diary
-- =============================================================================
-- Personal diary / notes: one row per note, owned by the signed-in user.
-- Run AFTER 0001-0007. Safe to re-run.
-- =============================================================================

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled',
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_notes_user_updated on public.notes (user_id, updated_at desc);

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

create or replace trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
