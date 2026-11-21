# Phase 7 – PhonePe AutoPay Sandbox Checkout (₹199/month)

This branch is intentionally **sandbox-only** and stacked on `feature/phase7-phonepe-subscription-foundation` (PR #9). **Do not merge to production or enable real billing** until the full subscription lifecycle and access controls have been reviewed.

## What this change implements

- Logged-in, same-origin POST `/api/payments/phonepe/checkout`.
- Server-owned price of **₹199 = 19900 paise**, fixed MONTHLY mandate request, unique IDs.
- PhonePe preprod token endpoint `POST /v1/oauth/token`, then `POST /checkout/v2/pay`.
- Server-only Supabase checkout-attempt records.
- Signed-in GET `/api/payments/phonepe/checkout/status?orderId=...` to reconcile **both** setup order and mandate state with PhonePe; cross-checks IDs, amounts, currency and frequency.
- Pricing-page test button shown only when `PHONEPE_ENV=sandbox`, `PHONEPE_SANDBOX_CHECKOUT_ENABLED=true`, and Vercel is **Preview** (or local development).
- **Never activates Pro or sets subscription status to active**, even on successful mandate setup. A verified first payment, subsequent renewal/redemption settlement and entitlement/revocation logic still need implementation.

## Setup (do these in the Preview environment only)

1. In Supabase SQL Editor, apply `supabase/phase7_subscriptions.sql` if it has not already been applied.
2. Then apply `supabase/phase7_sandbox_checkout.sql` (the new migration).
3. In Vercel for this **new branch's Preview deployment**, configure:
   - `PHONEPE_ENV=sandbox`
   - `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION` using the sandbox credentials, **server-only**.
   - `PHONEPE_RETURN_ORIGIN=https://<exact-preview-deployment-host>` with no trailing slash. It must match the browser Origin for the test checkout. Use the exact preview URL chosen for your testing.
   - `PHONEPE_SANDBOX_CHECKOUT_ENABLED=true` as an explicit opt-in. Remove or set false after UAT.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (service role remains server-only).
4. Redeploy this Preview branch after setting the variables. Sign in, open `/pricing` on this Preview URL, and press **Test ₹199/month Sandbox**.
5. Confirm that PhonePe shows the sandbox mandate flow. After returning, `/pricing?phonepe_order=...` calls the status endpoint; a verified setup still shows that **Pro is not active**.
6. Check Supabase `billing_checkout_attempts` and `billing_subscriptions` without disclosing secrets, and inspect Vercel request logs if needed.

## Safeguards and limitations

- Production endpoints are not reachable via the added API client, regardless of configuration.
- `Origin` must match the configured return URL for checkout initiation; credentials and bearer tokens are never returned to the browser.
- The linked PhonePe webhook on an **older Preview hostname** does not automatically move to this branch's new Preview URL. Point a **test** webhook to the matching branch URL only after deployment and credential configuration. Keep production webhook untouched.
- The previous Phase 7 webhook stores authenticated events only; it does **not** reconcile payments or grant paid access.
- Retry and concurrency protection is basic; add database-level idempotency / rate limiting before any live launch.
- Payment may succeed remotely before a local timeout; reconcile by merchantOrderId instead of assuming an error means no payment.
- Monthly renewals require **Notify Redemption**, **Execute Redemption**, payment verification, mandate state transitions, cancellation, refunds, dunning/retries and entitlements. None are implemented here.
- PhonePe merchant-specific AutoPay eligibility and go-live approvals are **not** proven by successful sandbox credentials or docs.

## Official PhonePe references

- Standard Checkout AutoPay setup: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/setup-subscription/api-integration
- Authorization: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/authorization
- Setup Order Status: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/order-status
- Subscription Status: https://developer.phonepe.com/payment-gateway/autopay/standard-checkout/subscription-status-2
