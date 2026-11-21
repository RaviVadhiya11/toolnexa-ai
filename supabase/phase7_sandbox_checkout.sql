-- Run after supabase/phase7_subscriptions.sql. Sandbox checkout attempts are server-controlled.
-- Does not activate paid entitlements or implement renewal settlement.
create table if not exists public.billing_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.billing_subscriptions(id) on delete cascade,
  merchant_order_id text not null unique,
  merchant_subscription_id text not null unique,
  provider_order_id text,
  state text not null default 'created' check (state in ('created','pending','setup_completed','failed','expired')),
  amount_paise bigint not null check (amount_paise = 19900),
  currency text not null default 'INR' check (currency = 'INR'),
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists billing_checkout_attempts_user_created_idx
  on public.billing_checkout_attempts(user_id, created_at desc);
alter table public.billing_checkout_attempts enable row level security;
revoke all on public.billing_checkout_attempts from anon, authenticated;
-- No browser policies. Only the backend service role can create/reconcile attempts.
