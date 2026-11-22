# PayPal subscriptions — ToolNexa AI
This is a gated integration scaffold, **not** a production-ready paid launch. Checkout is off by default.
1. Apply `supabase/migrations/20261122_paypal_subscriptions.sql` in Supabase.
2. Create a **sandbox** product and $3.99/month plan. Never mix sandbox and live IDs.
3. Set `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_ID`, `PAYPAL_WEBHOOK_ID`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel server environment. Do not prefix secrets with NEXT_PUBLIC.
4. Configure PayPal app webhook at `https://YOUR_DOMAIN/api/paypal/webhook` and subscribe to BILLING.SUBSCRIPTION.* and PAYMENT.SALE.* events.
5. Test authenticated checkout, cancelled/suspended plans, webhook signature failures, duplicate callbacks, mismatched plan and user, and Vercel build.
6. Add actual Pro feature enforcement based on server-side status. Current paid tools/credits are NOT implemented.
7. Only after paid functionality, policies, tax review, and live merchant approval, replace all sandbox credentials with live credentials and set `PAYPAL_CHECKOUT_ENABLED=true`.
Security: user ID is bound via subscription custom_id and verified with PayPal; client approval alone is never trusted. Webhooks are signature verified with PayPal. No client secret goes into the browser.
