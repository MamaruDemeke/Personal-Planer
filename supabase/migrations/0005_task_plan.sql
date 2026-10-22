-- =============================================================================
-- Mezgab - 0005_task_plan
-- =============================================================================
-- Adds the `tasks.plan` planning horizon (daily / weekly / monthly / yearly) to
-- databases that were created before the plan feature existed.

-- Running the full 0001_init_schema.sql would also add this column, but it DROPS
-- and recreates every table (resetting your data). This migration only adds the
-- missing pieces, so it is safe on a live project.
--
-- Run AFTER 0001. Safe to re-run: every statement is idempotent.
-- =============================================================================

-- The enum that backs the column (create only if it is missing).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_plan') then
    create type public.task_plan as enum ('daily', 'weekly', 'monthly', 'yearly');
  end if;
end
$$;

-- The column itself. Existing rows get the 'daily' default.
alter table public.tasks
  add column if not exists plan public.task_plan not null default 'daily';

-- Index used by the plan views.
create index if not exists idx_tasks_user_plan on public.tasks (user_id, plan);

-- Ask PostgREST to refresh its schema cache so the API sees the column at once
-- (otherwise it can keep reporting "column not found" until it reloads).
notify pgrst, 'reload schema';
