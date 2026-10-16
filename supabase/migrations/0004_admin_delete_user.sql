-- =============================================================================
-- Worker Planner - 0004_admin_delete_user
-- =============================================================================
-- Lets an administrator permanently delete an account WITHOUT the server
-- service-role key. The function is SECURITY DEFINER (runs with the owner's
-- privileges) and verifies the caller is an admin before deleting from
-- auth.users. Dependent rows (profiles, tasks, categories, reports,
-- payment_submissions) cascade automatically.
--
-- Run AFTER 0003. Safe to re-run.
-- =============================================================================

create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if target_id = auth.uid() then
    raise exception 'You cannot delete your own account' using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users where id = target_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  delete from auth.users where id = target_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
