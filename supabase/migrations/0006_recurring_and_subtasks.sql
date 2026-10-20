-- =============================================================================
-- Worker Planner - 0006_recurring_and_subtasks
-- =============================================================================
-- Adds Todoist-style recurring tasks and sub-tasks on top of the existing
-- `tasks` table, without touching any existing data.
--
-- Run AFTER 0001-0005. Safe to re-run: every statement is idempotent.
-- =============================================================================

-- Recurrence horizon. 'none' (default) means a normal one-off task.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_recurrence') then
    create type public.task_recurrence as enum ('none', 'daily', 'weekly', 'monthly', 'yearly');
  end if;
end
$$;

alter table public.tasks
  add column if not exists recurrence public.task_recurrence not null default 'none';

-- Self-referential parent for sub-tasks (Todoist-style nesting).
alter table public.tasks
  add column if not exists parent_id uuid references public.tasks (id) on delete cascade;

create index if not exists idx_tasks_user_recurrence on public.tasks (user_id, recurrence);
create index if not exists idx_tasks_parent on public.tasks (parent_id);

notify pgrst, 'reload schema';
