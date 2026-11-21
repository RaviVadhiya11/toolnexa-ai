-- Phase 7 foundation: subscription state is written by trusted server only.
create table if not exists public.billing_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null default 'phonepe' check (provider = 'phonepe'),
 merchant_subscription_id text unique,
 provider_subscription_id text unique,
 status text not null default 'pending' check (status in ('pending','active','paused','past_due','cancelled','expired')),
 plan_code text not null,
 currency text not null default 'INR' check (currency = 'INR'),
 amount_paise bigint not null check (amount_paise > 0),
 current_period_end timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists billing_subscriptions_user_idx on public.billing_subscriptions(user_id);
alter table public.billing_subscriptions enable row level security;
revoke all on public.billing_subscriptions from anon, authenticated;
grant select on public.billing_subscriptions to authenticated;
create policy "users read own subscriptions" on public.billing_subscriptions
 for select to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.billing_webhook_events (
 id uuid primary key default gen_random_uuid(),
 provider text not null default 'phonepe',
 event_key text not null unique,
 event_type text not null,
 received_at timestamptz not null default now(),
 processed_at timestamptz,
 processing_error text
);
alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_webhook_events from anon, authenticated;
-- Never grant browser users INSERT/UPDATE access to billing tables.
