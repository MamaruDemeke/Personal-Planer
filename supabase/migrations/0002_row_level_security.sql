-- =============================================================================
-- Planora — 0002_row_level_security
-- Enables RLS on every table and restricts rows to their owner (auth.uid()).
-- These policies are enforced by PostgreSQL itself, so direct access from the
-- browser (with the publishable/anon key) cannot read or mutate other users'
-- data even if the frontend is tampered with.
-- =============================================================================

alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.projects         enable row level security;
alter table public.tasks            enable row level security;
alter table public.goals            enable row level security;
alter table public.goal_milestones  enable row level security;
alter table public.events           enable row level security;
alter table public.notes            enable row level security;
alter table public.reminders        enable row level security;
alter table public.activity_logs    enable row level security;

-- -----------------------------------------------------------------------------
-- profiles — identified by id (== auth.uid()) rather than user_id
-- -----------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (id = auth.uid());

-- -----------------------------------------------------------------------------
-- user_id-scoped tables — identical policy set for each
-- -----------------------------------------------------------------------------
do $$
declare
  tbl text;
  tables text[] := array[
    'categories',
    'projects',
    'tasks',
    'goals',
    'goal_milestones',
    'events',
    'notes',
    'reminders',
    'activity_logs'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists %I on public.%I', tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for select using (user_id = auth.uid())',
      tbl || '_select_own', tbl
    );

    execute format('drop policy if exists %I on public.%I', tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for insert with check (user_id = auth.uid())',
      tbl || '_insert_own', tbl
    );

    execute format('drop policy if exists %I on public.%I', tbl || '_update_own', tbl);
    execute format(
      'create policy %I on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())',
      tbl || '_update_own', tbl
    );

    execute format('drop policy if exists %I on public.%I', tbl || '_delete_own', tbl);
    execute format(
      'create policy %I on public.%I for delete using (user_id = auth.uid())',
      tbl || '_delete_own', tbl
    );
  end loop;
end $$;
