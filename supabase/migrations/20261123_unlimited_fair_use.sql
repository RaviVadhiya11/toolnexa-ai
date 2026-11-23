-- ToolNexa AI: fair-use throttling for paid Unlimited subscriptions.
-- REQUIRED: Apply 20261123_account_usage.sql first.
-- Apply THIS migration before setting UNLIMITED_QUOTA_ENABLED=true.
-- This function imposes no DAILY cap: it atomically records each run.
-- To protect system availability, it permits up to 60 reservations
-- per account in each rolling one-minute window, subject to fair-use terms.
-- Only the trusted server service_role can call it.
create table if not exists public.unlimited_tool_throttle (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_started_at timestamptz not null default now(),
 used integer not null default 0 check (used >= 0)
);
alter table public.unlimited_tool_throttle enable row level security;
revoke all on public.unlimited_tool_throttle from anon, authenticated;

create or replace function public.consume_unlimited_tool_usage(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_window_count integer;
 v_daily_count integer;
begin
 if p_user_id is null then
  raise exception 'Invalid user';
 end if;

 insert into public.unlimited_tool_throttle(user_id,window_started_at,used)
 values (p_user_id,now(),1)
 on conflict (user_id) do update
 set
  window_started_at=case
   when public.unlimited_tool_throttle.window_started_at <= now()-interval '60 seconds'
   then now()
   else public.unlimited_tool_throttle.window_started_at
  end,
  used=case
   when public.unlimited_tool_throttle.window_started_at <= now()-interval '60 seconds'
   then 1
   else public.unlimited_tool_throttle.used+1
  end
 where public.unlimited_tool_throttle.window_started_at <= now()-interval '60 seconds'
    or public.unlimited_tool_throttle.used < 60
 returning used into v_window_count;
 if v_window_count is null then
  return null; -- Temporary per-minute fair-use limit, not a daily cap
 end if;

 insert into public.daily_tool_usage(user_id,usage_day,used)
 values (p_user_id,(now() at time zone 'UTC')::date,1)
 on conflict(user_id,usage_day) do update
 set used=public.daily_tool_usage.used+1,updated_at=now()
 returning used into v_daily_count;
 return v_daily_count;
end;
$$;
revoke all on function public.consume_unlimited_tool_usage(uuid) from public,anon,authenticated;
grant execute on function public.consume_unlimited_tool_usage(uuid) to service_role;
