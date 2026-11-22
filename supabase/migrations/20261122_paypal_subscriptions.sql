-- Apply in Supabase SQL Editor before enabling checkout.
create table if not exists public.paypal_subscriptions (
 subscription_id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 plan_id text not null,
 status text not null check(status in ('APPROVAL_PENDING','APPROVED','ACTIVE','SUSPENDED','CANCELLED','EXPIRED')),
 updated_at timestamptz not null default now()
);
create index if not exists paypal_subscriptions_user_idx on public.paypal_subscriptions(user_id);
alter table public.paypal_subscriptions enable row level security;
-- No anon/authenticated policies: only server-side service-role can read/write.
