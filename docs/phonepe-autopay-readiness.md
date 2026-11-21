# PhonePe UPI AutoPay — ToolNexa AI integration readiness

Status: **NOT LIVE**. This change does not collect payments or activate subscriptions.

## Official product and eligibility
PhonePe PG offers UPI AutoPay for recurring payments, but ToolNexa AI must be approved and enabled as an eligible merchant. A PhonePe consumer account or ordinary one-time PG account is not proof of AutoPay merchant enablement.

Request from PhonePe PG:
1. Merchant onboarding/KYC approval for a digital SaaS tools website, including any required business, bank, PAN and GST documentation applicable to the merchant.
2. Explicit enablement of **UPI AutoPay subscriptions** and confirmation that INR 199 and INR 499 monthly mandates are supported for this account.
3. UAT access, client ID/client secret, production credentials only after approval, webhook configuration details and UAT sign-off requirements.
4. Confirm fees, settlement cycle, refunds, cancellation behavior and any applicable category restrictions.

Official documentation: https://developer.phonepe.com/payment-gateway/autopay/api-integration/introduction

## Safe server architecture
- Plans are server-defined: free INR 0; pro INR 19900 paise/month; business INR 49900 paise/month. Never accept amount, user ID or plan price from the browser as authoritative.
- Require Supabase authenticated user and verify ownership on every subscription action.
- Keep PhonePe client secret, OAuth access token, service-role key and webhook secrets in server-only environment variables; never use NEXT_PUBLIC_ for secrets.
- Use unique merchant subscription IDs and unique merchant order IDs, stored in a database with user ownership, plan, amount, currency, billing interval, gateway IDs, and current status.
- Initiate mandate setup only after user consent; do not grant paid entitlements on redirect, setup initiation, or unverified browser success.
- Validate provider webhook authenticity using PhonePe's current documented mechanism, and recheck subscription/payment status server-to-server before granting/renewing entitlements.
- Persist webhook event IDs / payment IDs with unique constraints, process idempotently, handle out-of-order notifications, and log without secrets.
- Handle states pending, active, paused, failed, cancelled, expired, refunded. Define grace period and cancellation effective date explicitly.
- Notify/redemption and execute/redemption must follow the provider's documented recurring lifecycle; avoid naive monthly cron charges.
- Offer cancellation and display mandate terms, amount, frequency, renewal date, support contact, and refund policy.
- Apply RLS to user-owned subscription rows; only trusted server code may modify entitlements. Do not rely on admin UI hiding.
- Rate limit setup/status/cancel endpoints and protect against replay.

## PhonePe documented API lifecycle (not yet wired)
OAuth POST /v1/oauth/token
Setup POST /subscriptions/v2/setup
Order status GET /subscriptions/v2/order/{merchantOrderId}/status
Subscription status GET /subscriptions/v2/{merchantSubscriptionId}/status
Notify POST /subscriptions/v2/notify
Redeem POST /subscriptions/v2/redeem
Cancel POST /subscriptions/v2/{merchantSubscriptionId}/cancel
Refund POST /payments/v2/refund

Endpoints and request fields must be implemented against the exact approved AutoPay integration variant and tested in UAT, not guessed from one-time checkout APIs.

## Go-live acceptance tests
- Mandate approved/rejected/pending; payment successful/failed; delayed, duplicate and reordered webhooks.
- One account cannot modify another account's subscription.
- No duplicate charges/entitlements on retry; reconciliation of gateway and database status.
- Cancellation, refund, expired mandate and insufficient funds.
- Mobile checkout, UPI app handoff, production webhook reachability, customer support.
- UAT sign-off and production credentials verified before enabling purchase CTA.

Until these pass, pricing must clearly show **Coming Soon** and no working payment buttons.
