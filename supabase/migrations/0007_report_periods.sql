-- =============================================================================
-- Mezgab - 0007_report_periods
-- =============================================================================
-- Adds a `period` (daily / weekly / monthly / yearly) to work reports so a
-- user can keep one report per planning horizon instead of only daily ones.
--
-- Run AFTER 0001-0006. Safe to re-run: every statement is idempotent.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_period') then
    create type public.report_period as enum ('daily', 'weekly', 'monthly', 'yearly');
  end if;
end
$$;

alter table public.reports
  add column if not exists period public.report_period not null default 'daily';

-- Replace the old (user_id, report_date) uniqueness with (user_id, report_date, period).
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'reports_user_id_report_date_key'
  ) then
    alter table public.reports drop constraint reports_user_id_report_date_key;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'reports_user_id_report_date_period_key'
  ) then
    alter table public.reports
      add constraint reports_user_id_report_date_period_key
      unique (user_id, report_date, period);
  end if;
end
$$;

create index if not exists idx_reports_user_period on public.reports (user_id, period, report_date desc);

notify pgrst, 'reload schema';
