# ToolNexa AI — Complete Prelaunch Payments Setup

**This website is being prepared before public launch. Keep live PayPal checkout disabled until the merchant completes real end-to-end tests.** A passing build does not verify payments.

## Subscription prices (USD)

| Tier | Monthly | Yearly (upfront) | Daily tool runs | Batch analyzer texts/request |
|---|---:|---:|---|---:|
| Free | $0 | — | 10 successful runs/browser | — |
| Starter | $3.99 | $39.99 | 500 | 20 |
| Pro | $5.99 | $59.99 | 1,000 | 60 |
| Premium | $9.99 | $99.99 | 1,500 | 150 |
| Unlimited launch | $14.99 | $149.99 | No fixed daily cap; max 60 reservations per 60-second account window | 300 |

All batch analyzer texts are capped at 20,000 characters each. Unlimited does not include AI credits, unbounded file sizes or unlimited batch size. Planned future *reference* Unlimited prices ($19.99/month and $199.99/year) are **not** charged.

## Database and authentication

Verify these migrations are applied to production Supabase, in order:
1. `supabase/migrations/20261122_paypal_subscriptions.sql`
2. `supabase/migrations/20261123_account_usage.sql`
3. `supabase/migrations/20261123_unlimited_fair_use.sql`

Both quota functions must be restricted to `service_role`, with RLS enabled for their tables. `USAGE_DB_QUOTAS_ENABLED=true` and `UNLIMITED_QUOTA_ENABLED=true` are permitted only after verification. Supabase site URL / redirect allow-list must include the current Vercel URL, then the future purchased domain when ready.

## Configure eight distinct PayPal Live billing plans

Create **one active recurring PayPal plan for each tier and period**. Use one REGULAR cycle, no trial or setup period, no finite end, USD currency, MONTH/1 or YEAR/1 frequency, with price exactly as above.

| Tier | Monthly production variable | Yearly production variable |
|---|---|---|
| Starter | `PAYPAL_PLAN_ID_STARTER` (legacy `PAYPAL_PLAN_ID`) | `PAYPAL_PLAN_ID_STARTER_YEARLY` |
| Pro | `PAYPAL_PLAN_ID_PRO` | `PAYPAL_PLAN_ID_PRO_YEARLY` |
| Premium | `PAYPAL_PLAN_ID_PREMIUM` | `PAYPAL_PLAN_ID_PREMIUM_YEARLY` |
| Unlimited | `PAYPAL_PLAN_ID_UNLIMITED` | `PAYPAL_PLAN_ID_UNLIMITED_YEARLY` |

Never reuse IDs across tiers or periods. Configure the existing `PAYPAL_ENV=live`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` and `SUPABASE_SERVICE_ROLE_KEY` as server-side environment variables. Never paste secrets into chat or commit them to GitHub.

Current prelaunch webhook: `https://toolnexa-ai.vercel.app/api/paypal/webhook`. Configure subscription and sale events in PayPal. The webhook handler verifies PayPal signatures before recording subscription status.

**All eight selections now use guarded hosted PayPal checkout** via `/api/paypal/start`, which reads the live PayPal plan and verifies its actual price, currency, interval, ACTIVE status and no trial. This flow also checks for an existing active/approved subscription. After approval, `/subscribe/return` verifies membership; actual ACTIVE status is necessary before entitlement. Never swap live production credentials for sandbox test keys: use a separate nonproduction environment.

## Flags and release sequence

Keep these in Vercel production:

- `SITE_PUBLIC_LAUNCH_ENABLED=false` — disallow search indexing until domain, contact and policies ready.
- `USAGE_DB_QUOTAS_ENABLED=true` — account-scoped quotas (after database migration).
- `UNLIMITED_QUOTA_ENABLED=true` — account-scoped Unlimited fair-use function (after database migration).
- `PAYPAL_CHECKOUT_ENABLED=false` — global live checkout kill switch, until merchant acceptance.
- `PAYPAL_YEARLY_CHECKOUT_ENABLED=false` — separate yearly kill switch, until annual plans checked.
- `PAYPAL_UNLIMITED_CHECKOUT_ENABLED=false` — separate Unlimited kill switch, until Unlimited plans checked.

A new production deployment is required after changing environment variables.

## Mandatory acceptance checks before taking live money

1. Merchant confirms PayPal recurring-USD eligibility, legal/tax setup, accurate customer-facing prices and a working private support contact.
2. Test each of eight plan combinations, PayPal price/interval, customer approval, confirmed ACTIVE status, webhook sequencing and failed payments, using authorized transactions.
3. Test cancellation, refund process, duplicate checkout protection and that cancelling immediately removes access as the current policy discloses.
4. Test cross-device daily limits for Free, Starter, Pro and Premium; verify Unlimited has no fixed daily cap and the per-minute throttle returns a temporary error after 60 successful reservations.
5. Verify all tools on Android/desktop and file limits. Browser-local processing is bypassable outside the UI, so do not describe these limits as tamper-proof.
6. Owner reviews Terms, Privacy, Billing, support contact and refund wording for their actual business.
7. Only after these checks, enable the relevant checkout switches, deploy and verify.
8. Finally add the business domain, update PayPal return URLs, Supabase Auth allow-lists, Vercel domains and mail delivery, and set `SITE_PUBLIC_LAUNCH_ENABLED=true` at the public launch.

The current Vercel URL is accessible even in prelaunch; search indexing and payments should stay disabled.
