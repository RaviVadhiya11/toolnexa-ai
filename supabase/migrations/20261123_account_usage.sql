-- ToolNexa AI: atomic, account-scoped daily usage counters.
-- Apply once in Supabase SQL Editor before setting USAGE_DB_QUOTAS_ENABLED=true.
-- Counters use UTC dates; only service_role may execute the write RPC.
create table if not exists public.daily_tool_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_day)
);
alter table public.daily_tool_usage enable row level security;
revoke all on public.daily_tool_usage from anon, authenticated;
-- No permissive RLS policies: authenticated clients cannot read or write usage directly.
create or replace function public.consume_daily_tool_usage(
  p_user_id uuid, p_limit integer
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_used integer;
begin
  if p_user_id is null or p_limit is null or p_limit < 1 or p_limit > 100000 then
    raise exception 'Invalid usage limit';
  end if;
  insert into public.daily_tool_usage (user_id, usage_day, used)
    values (p_user_id, (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_day) do update
    set used = public.daily_tool_usage.used + 1, updated_at = now()
    where public.daily_tool_usage.used < p_limit
  returning used into v_used;
  return v_used; -- NULL when limit has been reached; atomic under concurrent requests
end;
$$;
revoke all on function public.consume_daily_tool_usage(uuid,integer) from public, anon, authenticated;
grant execute on function public.consume_daily_tool_usage(uuid,integer) to service_role;
-- Do not expose this RPC to client-side Supabase keys.
