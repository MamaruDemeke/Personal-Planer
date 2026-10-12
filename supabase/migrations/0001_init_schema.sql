-- =============================================================================
-- Planora — 0001_init_schema
-- Core schema: enums, tables, foreign keys, check constraints, indexes and
-- integrity triggers. All timestamps are `timestamptz` (stored in UTC).
--
-- Ownership model: every user-owned row carries `user_id` referencing
-- auth.users(id). Row Level Security (see 0002_row_level_security.sql) is the
-- source of truth for data isolation.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('todo', 'in_progress', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('active', 'paused', 'completed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'goal_status') then
    create type public.goal_status as enum ('active', 'completed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_channel') then
    create type public.reminder_channel as enum ('in_app', 'email', 'push');
  end if;
  if not exists (select 1 from pg_type where typname = 'reminder_status') then
    create type public.reminder_status as enum ('pending', 'sent', 'failed', 'cancelled');
  end if;
end $$;

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
-- profiles — one row per auth user, auto-created by a trigger on auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  full_name           text,
  avatar_url          text,
  timezone            text not null default 'UTC',
  theme               text not null default 'system'
                        check (theme in ('light', 'dark', 'system')),
  notification_prefs  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  color       text not null default '#0d9488',
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_categories_user on public.categories (user_id);
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  description text,
  status      public.project_status not null default 'active',
  start_date  timestamptz,
  deadline    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint projects_date_order check (
    start_date is null or deadline is null or deadline >= start_date
  )
);

create index if not exists idx_projects_user on public.projects (user_id);
create index if not exists idx_projects_user_status on public.projects (user_id, status);
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
create table if not exists public.tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  title             text not null check (length(trim(title)) > 0),
  description       text,
  category_id       uuid references public.categories (id) on delete set null,
  project_id        uuid references public.projects (id) on delete set null,
  priority          public.task_priority not null default 'medium',
  status            public.task_status not null default 'todo',
  start_date        timestamptz,
  due_date          timestamptz,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint tasks_date_order check (
    start_date is null or due_date is null or due_date >= start_date
  )
);

create index if not exists idx_tasks_user on public.tasks (user_id);
create index if not exists idx_tasks_user_status on public.tasks (user_id, status);
create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date);
create index if not exists idx_tasks_project on public.tasks (project_id);
create index if not exists idx_tasks_category on public.tasks (category_id);
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Keep completed_at consistent with status.
create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  elsif new.status <> 'completed' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger trg_tasks_completed_at
  before insert or update on public.tasks
  for each row execute function public.sync_task_completed_at();

-- -----------------------------------------------------------------------------
-- goals
-- -----------------------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null check (length(trim(title)) > 0),
  description   text,
  status        public.goal_status not null default 'active',
  target_date   timestamptz,
  target_value  numeric check (target_value is null or target_value >= 0),
  current_value numeric not null default 0 check (current_value >= 0),
  progress      integer not null default 0 check (progress between 0 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_goals_user on public.goals (user_id);
create index if not exists idx_goals_user_status on public.goals (user_id, status);
create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- goal_milestones
-- -----------------------------------------------------------------------------
create table if not exists public.goal_milestones (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references public.goals (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  due_date    timestamptz,
  completed   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_goal_milestones_goal on public.goal_milestones (goal_id);
create index if not exists idx_goal_milestones_user on public.goal_milestones (user_id);
create trigger trg_goal_milestones_updated_at
  before update on public.goal_milestones
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  description text,
  project_id  uuid references public.projects (id) on delete set null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  all_day     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint events_time_order check (end_time >= start_time)
);

create index if not exists idx_events_user on public.events (user_id);
create index if not exists idx_events_user_start on public.events (user_id, start_time);
create index if not exists idx_events_project on public.events (project_id);
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- notes
-- -----------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (length(trim(title)) > 0),
  content     text,
  category_id uuid references public.categories (id) on delete set null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_notes_user on public.notes (user_id);
create index if not exists idx_notes_user_updated on public.notes (user_id, updated_at desc);
create index if not exists idx_notes_tags on public.notes using gin (tags);
create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- reminders — attached to exactly one of a task or an event
-- -----------------------------------------------------------------------------
create table if not exists public.reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  task_id     uuid references public.tasks (id) on delete cascade,
  event_id    uuid references public.events (id) on delete cascade,
  remind_at   timestamptz not null,
  channel     public.reminder_channel not null default 'in_app',
  status      public.reminder_status not null default 'pending',
  sent_at     timestamptz,
  message     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint reminders_single_target check (
    (task_id is not null and event_id is null)
    or (task_id is null and event_id is not null)
  )
);

create index if not exists idx_reminders_user on public.reminders (user_id);
create index if not exists idx_reminders_user_remind on public.reminders (user_id, remind_at);
create index if not exists idx_reminders_task on public.reminders (task_id);
create index if not exists idx_reminders_event on public.reminders (event_id);
create trigger trg_reminders_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- activity_logs — append-only feed used by the dashboard
-- -----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null,
  entity_type text,
  entity_id   uuid,
  label       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_logs_user_created
  on public.activity_logs (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Cross-owner integrity: a user must never link to another user's records.
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
  return new;
end;
$$;

create trigger trg_tasks_refs_owner
  before insert or update on public.tasks
  for each row execute function public.assert_task_refs_owner();

create or replace function public.assert_event_project_owner()
returns trigger
language plpgsql
as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = new.project_id and p.user_id = new.user_id
  ) then
    raise exception 'project_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_events_refs_owner
  before insert or update on public.events
  for each row execute function public.assert_event_project_owner();

create or replace function public.assert_note_category_owner()
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

create trigger trg_notes_refs_owner
  before insert or update on public.notes
  for each row execute function public.assert_note_category_owner();

create or replace function public.assert_milestone_goal_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.goals g
    where g.id = new.goal_id and g.user_id = new.user_id
  ) then
    raise exception 'goal_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_goal_milestones_refs_owner
  before insert or update on public.goal_milestones
  for each row execute function public.assert_milestone_goal_owner();

create or replace function public.assert_reminder_target_owner()
returns trigger
language plpgsql
as $$
begin
  if new.task_id is not null and not exists (
    select 1 from public.tasks t
    where t.id = new.task_id and t.user_id = new.user_id
  ) then
    raise exception 'task_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  if new.event_id is not null and not exists (
    select 1 from public.events e
    where e.id = new.event_id and e.user_id = new.user_id
  ) then
    raise exception 'event_id does not belong to the current user'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_reminders_refs_owner
  before insert or update on public.reminders
  for each row execute function public.assert_reminder_target_owner();

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
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
