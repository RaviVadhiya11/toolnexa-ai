# ToolNexa AI

ToolNexa AI is a responsive web application built with Next.js 15, React 19, TypeScript, Supabase Auth, PayPal subscriptions, pdf-lib, and qrcode. It has 56 utility tools plus a paid Batch Text Analyzer.

Production site: https://toolnexa-ai.vercel.app

## Features

- Design 6 dark-navy and purple responsive interface, optional light theme, desktop sidebar and mobile navigation.
- 56 utilities across Text, Developer, Business, Image, PDF and Creator. New tools include verified browser-local PDF AES-256 encryption, Creator aspect resizing and public YouTube thumbnails. The title/hashtag generator now supports a guarded Google Gemini Flash-Lite AI Mode (when securely configured) and a separate transparent Offline Smart Mode.
- Gemini AI Mode is optional, server-only and disabled by default until GEMINI_API_KEY and GEMINI_AI_ENABLED=true are configured. Authenticated users are limited to 3 model generations/day and the whole site to 30 model generations/day, in addition to the normal tool-run quota. The Free API provider may still return its own 429 / 503 errors. Free-tier prompts may be used by Google for product improvement; never submit sensitive user content. See app/api/ai/social/route.ts and supabase/migrations/20261123_social_ai_free_quotas.sql.\n- Shared daily runs: Free 10, Starter 500, Pro 1,000, Premium 1,500; resets at 00:00 UTC. Guests use a per-browser counter. Authenticated accounts can share an atomic Supabase counter across browsers/devices after the SQL migration and environment flag are applied. Server-verifies PayPal plan and account identity; local execution remains browser-based, so browser tampering can still bypass the UI. Paid-account reservations count on a run attempt, including operations which later fail; guest usage only counts successful runs.
- Search, category filters, helpful tool landing pages and local recent-tool history.
- Sign up/sign in with Supabase Auth, Google OAuth where configured, email confirmation and email password reset.
- Paid Starter ($3.99/month or $39.99/year, 20 texts per batch), Pro ($5.99/month or $59.99/year, 60 texts), Premium ($9.99/month or $99.99/year, 150 texts) and Max ($14.99/month or $149.99/year, 300 texts). Annual prices are billed upfront every 12 months and save about 16% versus monthly billing. Paid batch analyzer limit is 20,000 characters per text. **Other premium tools and AI credits are not included.**
- Server-verified PayPal membership, signed webhooks, hosted subscription fallback, customer subscription overview and immediate cancellation request.
- SEO metadata, sitemap, robots, accessible error screens, security headers and public support/policy pages.

Max is the highest **capped** tier: **$14.99/month or $149.99/year**, with **3,000 daily tool runs** (UTC reset) and up to **300 texts per Batch Text Analyzer request**. It replaces the former planned Unlimited offer. No current plan includes unlimited AI generations, unlimited tool runs, or paid AI credits. The Gemini signed-in preview remains independently limited to 3 generations per day per account and 30 per day site-wide.

## Run locally

```bash
npm install
npm run dev
npm run build
npm run test:tools
```

The production build executes the tool catalogue guard and automated unit / QR / PDF smoke tests. These tests do not replace end-to-end browser testing.

## Required configuration

Use Vercel / local environment variables for Supabase browser URL and anon key and for server-side service access. Configure the correct **LIVE** PayPal credentials and the distinct plan IDs for Starter, Pro, Premium and Max according to the PayPal integration code. **Never commit client secrets or service-role keys.** The live checkout guard must remain disabled until merchant configuration, payments, webhook deliveries, cancellations and account eligibility have been verified.

Supabase Auth must allow the site's URL and the OAuth / recovery callback URLs. Password reset links use `/auth/callback?next=reset`; email redirect targets need to be authorized in Supabase.

## Configure separate monthly and yearly PayPal subscriptions

1. Use **eight distinct PayPal billing plans** for Starter, Pro, Premium and Max, billed either MONTHLY or YEARLY. Verify the actual amount, currency, recurrence, trial count and active status before checkout.
2. For the new capped Max plan, create brand-new recurring IDs `PAYPAL_PLAN_ID_MAX` ($14.99 USD monthly) and `PAYPAL_PLAN_ID_MAX_YEARLY` ($149.99 USD yearly). **Do not reuse historical Unlimited PayPal plan IDs**, even if the price is identical.
3. Keep `PAYPAL_MAX_CHECKOUT_ENABLED=false`, `PAYPAL_YEARLY_CHECKOUT_ENABLED=false` and `PAYPAL_CHECKOUT_ENABLED=false` until legitimate merchant tests have passed. Max also requires the account-scoped quota migration and `USAGE_DB_QUOTAS_ENABLED=true`.
4. All plans use a server-hosted PayPal approval flow verifying the live plan price and frequency, plus active-subscription duplicate prevention. Annual payment covers the next 12 months in advance.
5. Paid AI credits are not included. Optional Google Gemini AI Mode is a limited and separately protected **free preview**.

See [PAYPAL_SETUP.md](PAYPAL_SETUP.md) for details.

## Enable account-wide Supabase quotas

1. Open the Supabase SQL Editor for the existing production project, inspect and execute `supabase/migrations/20261123_account_usage.sql` once. This creates `public.daily_tool_usage` and the restricted `consume_daily_tool_usage` RPC.
2. Add `USAGE_DB_QUOTAS_ENABLED=true` to Vercel **server-side** environment variables, then redeploy. Keep it unset or false until the migration has succeeded. The service-role secret must be configured only on the server, never in client JavaScript.
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

All eight Starter/Pro/Premium/Max monthly and yearly checkout choices use the **same server-hosted PayPal approval flow**. The new Max plan has 3,000 account-scoped daily tool runs and 300 texts per batch; the atomic `consume_daily_tool_usage` RPC rejects runs over the daily cap. The historical unused Unlimited migration is no longer part of the application entitlements.

Signed-in Free users can use the account-backed Free quota without needing PayPal. Paid entitlements still require fresh PayPal verification. Website launch/indexing and payments remain off until prelaunch tests are completed.

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
