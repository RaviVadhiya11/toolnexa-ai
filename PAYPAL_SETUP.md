# ToolNexa AI — Prelaunch subscription and payment checklist

**Public launch and PayPal checkout remain disabled until merchant testing is complete.** There is no uncapped paid plan.

## Available plans (USD)

| Tier | Monthly | Yearly, billed upfront | Tools/day (00:00 UTC reset) | Batch texts/request |
| --- | ---: | ---: | ---: | ---: |
| Free | $0 | — | 10 browser-local successful runs | — |
| Starter | $3.99 | $39.99 | 500 | 20 |
| Pro | $5.99 | $59.99 | 1,000 | 60 |
| Premium | $9.99 | $99.99 | 1,500 | 150 |
| Max | $14.99 | $149.99 | **3,000** | **300** |

Each batch text supports 20,000 characters; normal file size limits also apply. All tool run allowances are finite; local processing is not tamper-proof if a user bypasses the UI.

**Gemini AI is separate from paid subscriptions.** Current free preview is up to 3 generations/day per signed-in user and 30/day across the whole website, subject to provider limits. Do not advertise guaranteed or unlimited AI credits with any paid plan. The Offline Smart Mode does not require Gemini API.

## Database

`supabase/migrations/20261123_account_usage.sql` creates the service-role-only atomic `consume_daily_tool_usage` RPC, used to cap **every** paid plan including Max. `USAGE_DB_QUOTAS_ENABLED=true` must be configured only after verifying the migration and RLS. The historical `20261123_unlimited_fair_use.sql` migration is **no longer used by application code**; it must not be used to grant new subscriptions.

`supabase/migrations/20261123_social_ai_free_quotas.sql` provides the protected Gemini preview per-user and site-wide counters.

## Create the missing PayPal Plan IDs safely

The current Vercel Production environment has configured monthly ID variables for Starter (legacy `PAYPAL_PLAN_ID`), Pro and Premium. **No Max monthly ID or yearly plan IDs are currently configured.** This means **five additional plan ID variables need values** before all four paid tiers support both billing periods. A PayPal Plan ID is issued by PayPal after creating a real billing plan; an arbitrary ID cannot be generated or reused.

For safe setup:

1. Sign into the **correct PayPal Business merchant** and verify that your account supports recurring international subscriptions, particularly for an India-based merchant. Do not enable live checkout before eligibility approval and a successful merchant test.
2. Create or locate a PayPal subscription **product** and note its `PROD-...` identifier. Keep all API secrets private. Ensure your sandbox credentials match the sandbox product, and live credentials match the live product.
3. The repository includes `scripts/paypal-provision-plans.mjs`. Run it *without arguments* first for a **dry run**: it only lists expected prices/intervals; it does not call PayPal or create plans.
4. For an individually reviewed sandbox plan, use `--only=Max-monthly --execute`, with `PAYPAL_ENV=sandbox`, `PAYPAL_PRODUCT_ID` and the merchant OAuth Client ID / Secret set **in your private execution environment**. For the yearly plan, choose `--only=Max-yearly --execute`. The script checks the created PayPal plan's status, price and recurrence before returning its `P-...` identifier.
5. After testing sandbox, live creation requires `PAYPAL_ENV=live`, `--execute` and an additional **`--confirm-live-payments` acknowledgement**. Create one plan at a time and save its verified ID before repeating; never generate duplicates or overwrite a subscriber's existing terms.
6. Add the new IDs to Vercel **Production Sensitive** variables: `PAYPAL_PLAN_ID_MAX`, `PAYPAL_PLAN_ID_MAX_YEARLY`, `PAYPAL_PLAN_ID_STARTER_YEARLY`, `PAYPAL_PLAN_ID_PRO_YEARLY`, `PAYPAL_PLAN_ID_PREMIUM_YEARLY`. Never put live secrets in GitHub, the browser or support screenshots. Keep all payment feature flags **false** until successful approval, webhook, cancellation and entitlement tests.

PayPal also provides a Business dashboard workflow for creating subscription plans manually. The website's server verifies actual amount and recurring interval before starting checkout. If the merchant account lacks supported recurring billing capabilities, **do not bypass this validation or pretend that paid plans are ready**.

## PayPal merchant setup

Create and validate eight distinct **Live** PayPal billing plans with a single regular USD recurring billing cycle, no trial, and the exact plan price / MONTH or YEAR billing interval:

| Tier | Monthly ID variable | Yearly ID variable |
| --- | --- | --- |
| Starter | `PAYPAL_PLAN_ID_STARTER` (or original `PAYPAL_PLAN_ID`) | `PAYPAL_PLAN_ID_STARTER_YEARLY` |
| Pro | `PAYPAL_PLAN_ID_PRO` | `PAYPAL_PLAN_ID_PRO_YEARLY` |
| Premium | `PAYPAL_PLAN_ID_PREMIUM` | `PAYPAL_PLAN_ID_PREMIUM_YEARLY` |
| **Max** | `PAYPAL_PLAN_ID_MAX` | `PAYPAL_PLAN_ID_MAX_YEARLY` |

**Do not reuse old Unlimited Plan IDs** for Max, even if amounts coincide. Each subscription's agreed terms and entitlements must match the plan that the customer actually approves.

Set `PAYPAL_ENV=live`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` in Vercel **server-only** production secrets. Never commit or paste keys into chat. Webhook URL (prelaunch) is `https://toolnexa-ai.vercel.app/api/paypal/webhook`.

All paid tiers start through `/api/paypal/start`, which checks live plan status, price, billing cycle, currency, no trial and duplicate active/approved subscriptions before opening PayPal.

Required production gates:
- `SITE_PUBLIC_LAUNCH_ENABLED=false` until the domain, legal pages, support details and payments are ready.
- `USAGE_DB_QUOTAS_ENABLED=true` after verified Supabase migration.
- `PAYPAL_CHECKOUT_ENABLED=false` global payment safety switch until verified.
- `PAYPAL_YEARLY_CHECKOUT_ENABLED=false` until each annual Plan ID is confirmed.
- `PAYPAL_MAX_CHECKOUT_ENABLED=false` until Max Monthly+Yearly Plans and account quotas pass acceptance tests.

## Before enabling payments

1. Verify PayPal recurring USD eligibility for your merchant account, especially if selling from India. Choose an appropriate alternative gateway for transactions that PayPal cannot process.
2. Confirm the exact eight advertised tier/period amounts against the actual PayPal approval screens and signed-in accounts.
3. Test successful activation, webhook signature and retries, renewal, cancel/failed payments, and account access removal.
4. Test account-scoped quotas including Max 3,000/day and daily UTC reset across devices; confirm Max batch limit 300.
5. Verify the separate Gemini free preview quota and API outage fallback. Provider rate limits can be lower than application budgets.
6. Review Terms, Privacy, billing/refund/support contacts. Only launch with complete real business details.
7. Then configure the domain, Auth redirects, webhooks and business email. Enable site indexing and checkout intentionally, followed by a fresh production deployment.

As of initial prelaunch setup, PayPal checkout remains disabled and there are no active paid subscriptions.
