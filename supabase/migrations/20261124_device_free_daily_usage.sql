-- ToolNexa AI: share Free daily usage across guest/login/signup/logout on one browser.
-- Device IDs are random first-party, HttpOnly cookie tokens issued by the application.
-- This is browser-scoped (not an unforgeable hardware identity).
create table if not exists public.daily_device_tool_usage (
  device_id uuid not null,
  usage_day date not null,
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (device_id, usage_day)
);
alter table public.daily_device_tool_usage enable row level security;
revoke all on public.daily_device_tool_usage from anon, authenticated;
-- Only the server's service_role can call these RPCs; no client RLS policies.
create or replace function public.sync_daily_device_tool_usage(
  p_device_id uuid, p_limit integer, p_floor integer
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_used integer;
begin
  if p_device_id is null or p_limit is null or p_limit < 1 or p_limit > 10000
     or p_floor is null or p_floor < 0 or p_floor > p_limit then
    raise exception 'Invalid device quota arguments';
  end if;
  insert into public.daily_device_tool_usage(device_id,usage_day,used)
    values(p_device_id,(now() at time zone 'UTC')::date,p_floor)
  on conflict (device_id,usage_day) do update
     set used=greatest(public.daily_device_tool_usage.used,excluded.used),
         updated_at=now()
  returning used into v_used;
  return v_used;
end;
$$;
revoke all on function public.sync_daily_device_tool_usage(uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.sync_daily_device_tool_usage(uuid,integer,integer) to service_role;

create or replace function public.consume_daily_device_tool_usage(
  p_device_id uuid, p_limit integer, p_floor integer default 0
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_used integer;
begin
  if p_device_id is null or p_limit is null or p_limit < 1 or p_limit > 10000
     or p_floor is null or p_floor < 0 or p_floor > p_limit then
    raise exception 'Invalid device quota arguments';
  end if;
  -- A pre-existing local daily count must not be reset by the migration.
  if p_floor >= p_limit then
    perform public.sync_daily_device_tool_usage(p_device_id,p_limit,p_floor);
    return null;
  end if;
  insert into public.daily_device_tool_usage(device_id,usage_day,used)
    values(p_device_id,(now() at time zone 'UTC')::date,p_floor+1)
  on conflict (device_id,usage_day) do update
    set used=greatest(public.daily_device_tool_usage.used,p_floor)+1,
        updated_at=now()
    where greatest(public.daily_device_tool_usage.used,p_floor)<p_limit
  returning used into v_used;
  return v_used; -- NULL when the shared device allowance is exhausted
end;
$$;
revoke all on function public.consume_daily_device_tool_usage(uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_daily_device_tool_usage(uuid,integer,integer) to service_role;
