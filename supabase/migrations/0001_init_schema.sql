-- =============================================================================
-- Worker Planner — 0001_init_schema
-- =============================================================================
-- Clean schema for the Worker Planner app: profiles, categories, tasks and
-- daily reports. All timestamps are `timestamptz` (UTC).
--
-- ⚠️  This script starts by DROPPING the app tables so it can be re-run. That
--     means it RESETS their data. Run it on a fresh project, or accept the
--     reset when upgrading from the previous schema.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Drop previous schema (safe / idempotent) so this file can be re-run.
-- -----------------------------------------------------------------------------
drop table if exists public.reports cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.reminders cascade;
drop table if exists public.events cascade;
drop table if exists public.notes cascade;
drop table if exists public.goal_milestones cascade;
drop table if exists public.goals cascade;
drop table if exists public.plans cascade;
drop table if exists public.tasks cascade;
drop table if exists public.categories cascade;
drop table if exists public.projects cascade;

drop type if exists public.task_status cascade;
drop type if exists public.task_priority cascade;
drop type if exists public.task_plan cascade;
drop type if exists public.task_recurrence cascade;
drop type if exists public.report_period cascade;
drop type if exists public.project_status cascade;
drop type if exists public.goal_status cascade;
drop type if exists public.reminder_channel cascade;
drop type if exists public.reminder_status cascade;
drop type if exists public.plan_period cascade;
drop type if exists public.plan_status cascade;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('not_started', 'in_progress', 'completed');
create type public.task_plan as enum ('daily', 'weekly', 'monthly', 'yearly');
create type public.task_recurrence as enum ('none', 'daily', 'weekly', 'monthly', 'yearly');
create type public.report_period as enum ('daily', 'weekly', 'monthly', 'yearly');

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user, auto-created on sign-up
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  timezone    text not null default 'UTC',
  theme       text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  color       text not null default '#0d9488',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index idx_categories_user on public.categories (user_id);
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- tasks
--   status: not_started | in_progress | completed  (overdue is derived in the API)
--   progress: 0..100, kept consistent with status/completed_at by a trigger
-- -----------------------------------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null check (length(trim(title)) > 0),
  description     text,
  notes           text,
  category_id     uuid references public.categories (id) on delete set null,
  priority        public.task_priority not null default 'medium',
  status          public.task_status not null default 'not_started',
  plan            public.task_plan not null default 'daily',
  recurrence      public.task_recurrence not null default 'none',
  parent_id       uuid references public.tasks (id) on delete cascade,
  start_date      timestamptz,
  deadline        timestamptz,
  progress        integer not null default 0 check (progress between 0 and 100),
  completed_at    timestamptz,
  completed_late  boolean,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint tasks_date_order check (
    start_date is null or deadline is null or deadline >= start_date
  )
);

create index idx_tasks_user on public.tasks (user_id);
create index idx_tasks_user_status on public.tasks (user_id, status);
create index idx_tasks_user_plan on public.tasks (user_id, plan);
create index idx_tasks_user_recurrence on public.tasks (user_id, recurrence);
create index idx_tasks_parent on public.tasks (parent_id);
create index idx_tasks_user_deadline on public.tasks (user_id, deadline);
create index idx_tasks_category on public.tasks (category_id);
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Keep status / progress / completed_at / completed_late consistent.
create or replace function public.sync_task_completion()
returns trigger
language plpgsql
as $$
begin
  -- Progress of 100 always completes the task.
  if new.progress >= 100 then
    new.status := 'completed';
  end if;

  if new.status = 'completed' then
    new.progress := 100;
    new.completed_at := coalesce(new.completed_at, now());
    new.completed_late := (new.deadline is not null and new.completed_at > new.deadline);
  else
    new.completed_at := null;
    new.completed_late := null;
    if new.progress > 0 and new.status = 'not_started' then
      new.status := 'in_progress';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_tasks_completion
  before insert or update on public.tasks
  for each row execute function public.sync_task_completion();

-- A task may only reference a category owned by the same user.
create or replace function public.assert_task_category_owner()
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
  return new;
end;
$$;

create trigger trg_tasks_category_owner
  before insert or update on public.tasks
  for each row execute function public.assert_task_category_owner();

-- -----------------------------------------------------------------------------
-- reports — one daily work report per user per date
-- -----------------------------------------------------------------------------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  report_date   date not null,
  period        public.report_period not null default 'daily',
  completed     text,
  ongoing       text,
  pending       text,
  blockers      text,
  achievements  text,
  tomorrow_plan text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, report_date, period)
);

create index idx_reports_user_date on public.reports (user_id, report_date desc);
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-create a profile row whenever an auth user signs up.
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
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
