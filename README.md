# ToolNexa AI

ToolNexa AI is a responsive web application built with Next.js 15, React 19, TypeScript, Supabase Auth, PayPal subscriptions, pdf-lib, and qrcode. It has 56 utility tools plus a paid Batch Text Analyzer.

Production site: https://toolnexa-ai.vercel.app

## Features

- Design 6 dark-navy and purple responsive interface, optional light theme, desktop sidebar and mobile navigation.
- 56 utilities across Text, Developer, Business, Image, PDF and Creator. New tools include verified browser-local PDF AES-256 encryption, Creator aspect resizing and public YouTube thumbnails. The title/hashtag generator now supports a guarded Google Gemini Flash-Lite AI Mode (when securely configured) and a separate transparent Offline Smart Mode.
- Gemini AI Mode is optional, server-only and disabled by default until GEMINI_API_KEY and GEMINI_AI_ENABLED=true are configured. Authenticated users are limited to 3 model generations/day and the whole site to 30 model generations/day, in addition to the normal tool-run quota. The Free API provider may still return its own 429 / 503 errors. Free-tier prompts may be used by Google for product improvement; never submit sensitive user content. See app/api/ai/social/route.ts and supabase/migrations/20261123_social_ai_free_quotas.sql.\n- Shared daily runs: Free 10, Starter 500, Pro 1,000, Premium 1,500; resets at 00:00 UTC. Guests use a per-browser counter. Authenticated accounts can share an atomic Supabase counter across browsers/devices after the SQL migration and environment flag are applied. Server-verifies PayPal plan and account identity; local execution remains browser-based, so browser tampering can still bypass the UI. Paid-account reservations count on a run attempt, including operations which later fail; guest usage only counts successful runs.
- Search, category filters, helpful tool landing pages and local recent-tool history.
- Sign up/sign in with Supabase Auth, Google OAuth where configured, email confirmation and email password reset.
- Paid Starter ($3.99/month or $39.99/year, 20 texts per batch), Pro ($5.99/month or $59.99/year, 60 texts), Premium ($9.99/month or $99.99/year, 150 texts). Annual prices are billed upfront every 12 months and save about 16% versus monthly billing. Paid batch analyzer limit is 20,000 characters per text. **Other premium tools and AI credits are not included.**
- Server-verified PayPal membership, signed webhooks, hosted subscription fallback, customer subscription overview and immediate cancellation request.
- SEO metadata, sitemap, robots, accessible error screens, security headers and public support/policy pages.

Unlimited launch pricing is **$14.99/month or $149.99/year**. These are the only amounts the Unlimited server checkout validates. Planned future regular prices **$19.99/month or $199.99/year** are previews only, not automatically charged. Unlimited monthly/yearly checkout stays **disabled by default** pending PayPal Live plan setup, the extra Supabase migration, verification and explicit feature flags. After activation, Unlimited members have no fixed daily cap on the 20 browser-run tools, subject to **60 run reservations per minute per account** and a Batch Text Analyzer limit of 300 texts per request. This is not uncapped AI usage, file size, batch size, or server processing.

## Run locally

```bash
npm install
npm run dev
npm run build
npm run test:tools
```

The production build executes the tool catalogue guard and automated unit / QR / PDF smoke tests. These tests do not replace end-to-end browser testing.

## Required configuration

Use Vercel / local environment variables for Supabase browser URL and anon key and for server-side service access. Configure the correct **LIVE** PayPal credentials and the distinct plan IDs for Starter, Pro and Premium according to the PayPal integration code. **Never commit client secrets or service-role keys.** The live checkout guard must remain disabled until merchant configuration, payments, webhook deliveries, cancellations and account eligibility have been verified.

Supabase Auth must allow the site's URL and the OAuth / recovery callback URLs. Password reset links use `/auth/callback?next=reset`; email redirect targets need to be authorized in Supabase.

## Configure separate monthly and yearly PayPal subscriptions

1. Existing monthly live PayPal plan IDs use `PAYPAL_PLAN_ID_STARTER` (or legacy `PAYPAL_PLAN_ID`), `PAYPAL_PLAN_ID_PRO`, and `PAYPAL_PLAN_ID_PREMIUM`. Keep these unchanged to preserve current subscriptions.
2. In PayPal Live, create **three additional recurring billing plans** with frequency `YEAR`, interval `1`, USD prices exactly **$39.99 Starter**, **$59.99 Pro**, **$99.99 Premium**. Configure these distinct, active billing plan IDs as Vercel server environment variables `PAYPAL_PLAN_ID_STARTER_YEARLY`, `PAYPAL_PLAN_ID_PRO_YEARLY`, and `PAYPAL_PLAN_ID_PREMIUM_YEARLY`. Do not reuse monthly plan IDs or share IDs between tiers.
3. Only after checking the PayPal billing frequency, amount, billing disclosure, webhooks, payment confirmation, yearly entitlement, dashboard and cancellation in a real authorized test, set `PAYPAL_YEARLY_CHECKOUT_ENABLED=true` in Vercel and redeploy. Keep it absent/false beforehand. Existing live-checkout guard `PAYPAL_CHECKOUT_ENABLED=true` and other PayPal/Supabase environment settings are also required.
4. The Pricing page offers a Monthly/Yearly toggle and shows the annual price upfront. Monthly checkout keeps the existing PayPal SDK and hosted fallback; yearly checkout uses the guarded server-hosted PayPal flow with the separate annual billing plan ID. Server-side membership verification and account management recognize active annual subscriptions even if the yearly checkout flag is later disabled.
5. Annual entitlements have the **same daily tool and batch limits as their monthly tier**; only the billing recurrence changes. Existing customers cannot automatically change billing frequency on an active subscription; they must manage/cancel it before subscribing anew. Cancellation is immediate and may end access immediately. Check price/frequency in PayPal before approving; do not activate a mismatched plan.
6. Unlimited is independently gated behind PAYPAL_UNLIMITED_CHECKOUT_ENABLED and its Supabase fair-use migration. Do not enable it until every requirement below is met.

## Enable Unlimited monthly and yearly checkout (only after verification)

1. First apply the existing account-quota migration `supabase/migrations/20261123_account_usage.sql` to the production Supabase SQL Editor, then apply `supabase/migrations/20261123_unlimited_fair_use.sql`. Verify both RPCs, database access and RLS before enabling flags. `consume_unlimited_tool_usage` records account-wide runs with no fixed daily cap and atomically limits to 60 reservations per minute per account. Local browser code remains bypassable outside the official UI.
2. Create **two distinct active PayPal Live recurring plans** for Unlimited: `PAYPAL_PLAN_ID_UNLIMITED` (USD $14.99 every MONTH) and `PAYPAL_PLAN_ID_UNLIMITED_YEARLY` (USD $149.99 every YEAR). Use only regular single billing cycles with no trial/introductory cycles. Configure both IDs in Vercel server environment variables. Existing plans must remain unchanged. Unlimited checkout always uses the server-hosted flow that confirms actual PayPal amount, currency, frequency and plan status before initiating payment.
3. Apply and verify server-side env flags `USAGE_DB_QUOTAS_ENABLED=true`, `UNLIMITED_QUOTA_ENABLED=true`, and (after full Live checkout/entitlement tests) `PAYPAL_UNLIMITED_CHECKOUT_ENABLED=true`. Yearly checkout additionally requires `PAYPAL_YEARLY_CHECKOUT_ENABLED=true` and the existing global `PAYPAL_CHECKOUT_ENABLED=true` guard. Keep Unlimited checkout disabled until approved live billing and test results are confirmed.
4. Verify successful sign-in, monthly and yearly payment approval, webhook activation, automatic Unlimited membership, reservation rate limiting, cancellation and entitlement removal, dashboard display, and cross-device account usage. `Unlimited` does NOT include AI credits or remove file and batch-size limits.
5. Launch pricing is not retroactively replaced with the regular reference price. Changes to PayPal renewal amounts for existing subscribers require proper billing processes and customer notice/consent where applicable; a separate new plan is safer.

## Enable account-wide Supabase quotas

1. Open the Supabase SQL Editor for the existing production project, inspect and execute `supabase/migrations/20261123_account_usage.sql` once. This creates `public.daily_tool_usage` and the restricted `consume_daily_tool_usage` RPC.
2. Add `USAGE_DB_QUOTAS_ENABLED=true` to Vercel **server-side** environment variables, then redeploy. Keep it unset or false until the migration has succeeded. No service-role secret is needed in client JavaScript.
3. Test a signed-in Free user across two browsers/devices: a successful quota reservation on either should update both. Concurrent requests are handled atomically in the database. Test a real active PayPal tier before claiming premium works.
4. Signed-out guests still receive the 10-run **browser-local** limit, not an account-wide quota. Stopping guest browser resets needs a stronger identity/abuse solution. Since all tool algorithms run in browser JavaScript, a malicious user can bypass the UI regardless of a server counter; moving processing behind a guarded server would be required for tamper-resistant execution and adds data-processing/privacy tradeoffs.

## Limits and caveats

- Browser file conversions are local; selected input files are not uploaded through a ToolNexa file API. Tool usage counts may be recorded separately.
- Image conversion may discard metadata / animation. Image/PDF input is limited to 25 MB per file. Multiple file jobs have additional combined-size caps.
- Most editing tools cannot open already password-protected PDFs; the new Protect PDF tool can encrypt an ordinary PDF with AES-256. Merge PDF handles up to 15 PDFs; Image to PDF handles up to 20 images. Split PDF extracts selected pages to a single PDF.
- Text to PDF rasterizes Unicode text using browser fonts and outputs image-backed pages; resulting PDF text is not searchable or selectable.
- The site's paid subscription entitlement depends on live PayPal API and Supabase availability. Passing CI does **not** confirm successful live payments.
- Public policy/help pages describe the implementation; **business owner must review legal wording, refund handling, jurisdiction requirements, and a private support contact before launch**. The GitHub Issues link is only for non-sensitive bug reports, never personal or billing information.

## Prelaunch safety and readiness

**This project is not publicly launched yet.** It may be accessible using its Vercel URL. With `SITE_PUBLIC_LAUNCH_ENABLED=false`, the site sends noindex metadata, disallows crawling in robots.txt and leaves the sitemap empty. Enable public search indexing only after the domain and business contact are ready.

All eight Starter/Pro/Premium/Unlimited monthly and yearly checkout choices use the **same server-hosted PayPal approval flow**. Before creating a subscription it checks the Live billing plan's actual USD amount, active status, and month/year frequency with no trial cycles and rejects duplicate approved/active subscriptions. Checkout is disabled by the global PayPal flag and separate Yearly/Unlimited safety flags until owner-verified merchant setup. See [PAYPAL_SETUP.md](PAYPAL_SETUP.md) for the full prelaunch runbook and the exact eight PayPal Live plan IDs.

Signed-in Free users can use the database-backed Free quota without having to contact PayPal or provision a paid plan. All paid entitlements still require a fresh PayPal verification. Unlimited has no fixed daily cap but the Supabase function imposes fair-use protection: up to 60 reserved runs per account per 60-second throttle window.

## Before promoting to public launch

1. Confirm production Vercel deployment is Ready.
2. Run practical Android/desktop checks for representative text, QR, image and PDF inputs.
3. Verify Supabase account confirmation, OAuth redirect and password recovery with the production URL allow-list.
4. Confirm PayPal live plan IDs, merchant approval, successful recurring purchase, verified entitlements and cancellation — do not infer these from passing build checks.
5. Review Terms, Privacy and Billing pages against the business's actual practices and add a private contact/support channel.

## Links

- [All tools](https://toolnexa-ai.vercel.app/tools)
- [Pricing](https://toolnexa-ai.vercel.app/pricing)
- [Support](https://toolnexa-ai.vercel.app/support)
- [Privacy](https://toolnexa-ai.vercel.app/privacy)
- [Terms](https://toolnexa-ai.vercel.app/terms)
- [Billing and cancellation](https://toolnexa-ai.vercel.app/billing)
