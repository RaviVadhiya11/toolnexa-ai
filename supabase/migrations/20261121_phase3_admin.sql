-- ToolNexa AI Phase 3: server-managed tool settings and privacy-safe usage totals.
create table if not exists public.tool_settings (
 slug text primary key,
 enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.tool_settings enable row level security;
-- No client policies: writes and admin reads use server-side service role after auth allowlist verification.
create table if not exists public.tool_usage_daily (
 day date not null,
 slug text not null,
 uses bigint not null default 0 check (uses >= 0),
 primary key(day,slug)
);
alter table public.tool_usage_daily enable row level security;
-- Aggregates only; no user identities stored in this table.
