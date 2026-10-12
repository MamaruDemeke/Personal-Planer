-- =============================================================================
-- Planora — 0003_plans
-- Planning & progress tracking: daily / weekly / monthly / yearly plans.
--
-- A "plan" is a time-bounded container. Tasks opt into a plan via
-- `tasks.plan_id`, and a plan's progress is derived from its linked tasks.
--
-- Design rules (from the product spec):
--   * A plan is NEVER auto-completed when its deadline passes. It becomes
--     "overdue" — a status the UI derives — while staying `active`.
--   * When a user completes a plan the database records the completion
--     timestamp, the final completion percentage (snapshotted from the tasks
--     at that moment) and the actual results.
--   * Expected vs actual results are kept side by side for comparison.
--
-- Safe to run on an existing database: uses IF NOT EXISTS / CREATE OR REPLACE
-- and only adds a nullable column to `tasks`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_period') then
    create type public.plan_period as enum ('daily', 'weekly', 'monthly', 'yearly');
  end if;
  if not exists (select 1 from pg_type where typname = 'plan_status') then
    create type public.plan_status as enum ('active', 'completed', 'archived');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- plans
-- -----------------------------------------------------------------------------
create table if not exists public.plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text not null check (length(trim(title)) > 0),
  description      text,
  period           public.plan_period not null default 'weekly',
  priority         public.task_priority not null default 'medium',
  status           public.plan_status not null default 'active',
  start_date       timestamptz,
  deadline         timestamptz,
  expected_results text,
  actual_results   text,
  final_progress   integer check (final_progress is null or final_progress between 0 and 100),
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint plans_date_order check (
    start_date is null or deadline is null or deadline >= start_date
  )
);

create index if not exists idx_plans_user on public.plans (user_id);
create index if not exists idx_plans_user_status on public.plans (user_id, status);
create index if not exists idx_plans_user_deadline on public.plans (user_id, deadline);

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Link tasks to plans (nullable — existing tasks are unaffected).
-- -----------------------------------------------------------------------------
alter table public.tasks
  add column if not exists plan_id uuid references public.plans (id) on delete set null;

create index if not exists idx_tasks_plan on public.tasks (plan_id);

-- -----------------------------------------------------------------------------
-- Cross-owner integrity: a task may only reference its owner's plan.
-- (Replaces the function from 0001 to add the plan check.)
-- -----------------------------------------------------------------------------
create or replace function public.assert_task_refs_owner()
returns trigger
language plpgsql
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id
  ) then
    raise exception 'category_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  if new.project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = new.project_id and p.user_id = new.user_id
  ) then
    raise exception 'project_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  if new.plan_id is not null and not exists (
    select 1 from public.plans pl
    where pl.id = new.plan_id and pl.user_id = new.user_id
  ) then
    raise exception 'plan_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Completion bookkeeping.
--
-- On completion:  record completed_at (if not supplied) and snapshot the final
--                 completion percentage from the currently linked tasks.
-- On reopen:      clear completed_at / final_progress (archiving keeps them).
-- The trigger intentionally NEVER flips status — only the user does that.
-- -----------------------------------------------------------------------------
create or replace function public.sync_plan_completion()
returns trigger
language plpgsql
as $$
declare
  v_done  integer;
  v_total integer;
begin
  if new.status = 'completed' then
    if tg_op = 'INSERT' or old.status is distinct from 'completed' then
      select
        count(*) filter (where t.status = 'completed'),
        count(*)
      into v_done, v_total
      from public.tasks t
      where t.plan_id = new.id;

      new.final_progress := case
        when v_total > 0 then round(v_done * 100.0 / v_total)::int
        else coalesce(new.final_progress, 0)
      end;

      if new.completed_at is null then
        new.completed_at := now();
      end if;
    end if;
  elsif new.status = 'active' then
    new.completed_at := null;
    new.final_progress := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_plans_completion on public.plans;
create trigger trg_plans_completion
  before insert or update on public.plans
  for each row execute function public.sync_plan_completion();

-- -----------------------------------------------------------------------------
-- Row Level Security — identical owner-only policy set as every other table.
-- -----------------------------------------------------------------------------
alter table public.plans enable row level security;

drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_own"
  on public.plans for select
  using (user_id = auth.uid());

drop policy if exists "plans_insert_own" on public.plans;
create policy "plans_insert_own"
  on public.plans for insert
  with check (user_id = auth.uid());

drop policy if exists "plans_update_own" on public.plans;
create policy "plans_update_own"
  on public.plans for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "plans_delete_own" on public.plans;
create policy "plans_delete_own"
  on public.plans for delete
  using (user_id = auth.uid());
