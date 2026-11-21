-- Phase 5: aggregate tool usage without storing user identities.
-- Run in Supabase SQL Editor after Phase 3 has created public.tool_usage_daily.
create or replace function public.increment_tool_usage(p_slug text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_slug is null or length(p_slug) > 80 or p_slug !~ '^[a-z0-9-]+$' then
    raise exception 'Invalid tool slug';
  end if;
  insert into public.tool_usage_daily(day, slug, uses)
  values ((now() at time zone 'UTC')::date, p_slug, 1)
  on conflict (day, slug)
  do update set uses = public.tool_usage_daily.uses + 1;
end;
$$;
revoke all on function public.increment_tool_usage(text) from public, anon, authenticated;
grant execute on function public.increment_tool_usage(text) to service_role;
