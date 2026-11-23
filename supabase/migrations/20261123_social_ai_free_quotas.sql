-- ToolNexa AI: limited FREE Gemini text generation for signed-in accounts.
-- In addition to the standard daily local-tool allowance, allow 3 AI generations
-- per signed-in user per UTC day, and only 30 successful reservations globally
-- per UTC day. Quotas are deliberately separate from paid plans: no paid tier
-- promises unlimited AI generations. Fail closed when quota RPC is missing.
create table if not exists public.social_ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  used integer not null default 0 check (used >= 0),
  primary key (user_id, usage_day)
);
create table if not exists public.social_ai_global_daily (
  usage_day date primary key,
  used integer not null default 0 check (used >= 0)
);
alter table public.social_ai_usage_daily enable row level security;
alter table public.social_ai_global_daily enable row level security;
revoke all on public.social_ai_usage_daily from anon, authenticated;
revoke all on public.social_ai_global_daily from anon, authenticated;
-- Keep the only writer service-role-only: browser clients cannot reserve directly.
create or replace function public.reserve_social_ai_usage(p_user_id uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'UTC')::date;
  v_global integer;
  v_user integer;
begin
  if p_user_id is null then raise exception 'Invalid account'; end if;
  insert into public.social_ai_global_daily (usage_day,used)
    values (v_day,1)
  on conflict (usage_day) do update
    set used = public.social_ai_global_daily.used+1
    where public.social_ai_global_daily.used < 30
  returning used into v_global;
  if v_global is null then
    raise exception 'Global AI free-tier daily quota reached' using errcode='P0001';
  end if;
  insert into public.social_ai_usage_daily (user_id,usage_day,used)
    values (p_user_id,v_day,1)
  on conflict (user_id,usage_day) do update
    set used = public.social_ai_usage_daily.used+1
    where public.social_ai_usage_daily.used < 3
  returning used into v_user;
  if v_user is null then
    -- Exception rolls back prior global reservation in this transaction.
    raise exception 'Account AI daily quota reached' using errcode='P0001';
  end if;
  return v_user;
end;
$$;
revoke all on function public.reserve_social_ai_usage(uuid) from public, anon, authenticated;
grant execute on function public.reserve_social_ai_usage(uuid) to service_role;
