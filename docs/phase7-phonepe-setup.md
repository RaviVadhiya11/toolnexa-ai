# Phase 7: PhonePe recurring billing foundation (UAT only)

## Implemented
- Protected SHA-authenticated webhook receiver at `/api/payments/phonepe/webhook`
- Idempotent event receipt storage in Supabase
- RLS-protected subscription table, read-only for its owning user
- **No automatic subscription activation, mandate creation, payment capture, or billing entitlement changes.**

## Before testing
1. Apply `supabase/phase7_subscriptions.sql` in the correct Supabase project.
2. In Vercel, configure server-only `SUPABASE_SERVICE_ROLE_KEY`, `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD`. Existing `NEXT_PUBLIC_SUPABASE_URL` must point to the same project. Never prefix secrets with `NEXT_PUBLIC_`.
3. Generate unique webhook username/password securely. Do not reuse PhonePe Client ID/Client Secret as webhook credentials.
4. Configure PhonePe Test Mode webhook URL only **after deployment** and select SHA with the same webhook username/password. The intended URL is `https://toolnexa-ai.vercel.app/api/payments/phonepe/webhook`.
5. Test invalid authorization (must return 401), invalid JSON (400), valid signed sample delivery (200), duplicate delivery (one database row), and DB outage (503).
6. Confirm PhonePe recurring/UPI AutoPay merchant enablement and subscription UAT API credentials with PhonePe support. Webhook event visibility alone does not establish enablement.
7. Verify current PhonePe SHA callback authentication format against merchant-specific official docs before registering webhook. Do not switch to HMAC without implementing HMAC validation.
8. Before going live: validate event schemas, reconcile each subscription via server-side PhonePe status API, handle cancellation/refunds/disputes and out-of-order deliveries, add monitoring and retry strategy, verify security and CI.

## Important
This is a **foundation only**. Webhook receipt does not prove payment success. No Pro access is granted from webhook data. No production webhook or credentials should be configured yet.
