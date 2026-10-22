-- =============================================================================
-- Worker Planner - 0009_task_reminders_and_work_notes
-- =============================================================================
-- Adds a per-task reminder timestamp (phone/system ring) and a free-form
-- work-notes field to record progress on a task.
-- Run AFTER 0001-0008. Safe to re-run.
-- =============================================================================
alter table public.tasks
  add column if not exists reminder_at timestamptz;

alter table public.tasks
  add column if not exists work_notes text;

create index if not exists idx_tasks_reminder on public.tasks (user_id, reminder_at);

notify pgrst, 'reload schema';
