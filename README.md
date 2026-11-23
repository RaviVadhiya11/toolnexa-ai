# ToolNexa AI

ToolNexa AI is a responsive web application built with Next.js 15, React 19, TypeScript, Supabase Auth, PayPal subscriptions, pdf-lib, and qrcode. It has 20 free browser-based tools plus a paid Batch Text Analyzer.

Production site: https://toolnexa-ai.vercel.app

## Features

- Design 6 dark-navy and purple responsive interface, optional light theme, desktop sidebar and mobile navigation.
- 20 browser-side utilities across Text, Developer, Business, Image and PDF.
- Shared per-browser daily runs: Free 10, Starter 150, Pro 500, Premium 2,000; resets at 00:00 UTC. Checked before each operation and increments only after successful processing; subscription tier is fetched from server-verified membership status, not trusted from localStorage. This is a client-side UX quota, **not tamper-resistant or synced across devices**. True abuse-proof enforcement requires server-backed atomic quotas and authorization for each operation.
- Search, category filters, helpful tool landing pages and local recent-tool history.
- Sign up/sign in with Supabase Auth, Google OAuth where configured, email confirmation and email password reset.
- Paid Starter ($3.99/month, 20 texts per batch), Pro ($5.99/month, 60 texts), Premium ($9.99/month, 150 texts). Paid batch analyzer limit is 20,000 characters per text. **Other premium tools and AI credits are not included.**
- Server-verified PayPal membership, signed webhooks, hosted subscription fallback, customer subscription overview and immediate cancellation request.
- SEO metadata, sitemap, robots, accessible error screens, security headers and public support/policy pages.

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

## Limits and caveats

- Browser file conversions are local; selected input files are not uploaded through a ToolNexa file API. Tool usage counts may be recorded separately.
- Image conversion may discard metadata / animation. Image/PDF input is limited to 25 MB per file. Multiple file jobs have additional combined-size caps.
- Password-protected PDFs are not supported. Merge PDF handles up to 15 PDFs; Image to PDF handles up to 20 images. Split PDF extracts selected pages to a single PDF.
- Text to PDF rasterizes Unicode text using browser fonts and outputs image-backed pages; resulting PDF text is not searchable or selectable.
- The site's paid subscription entitlement depends on live PayPal API and Supabase availability. Passing CI does **not** confirm successful live payments.
- Public policy/help pages describe the implementation; **business owner must review legal wording, refund handling, jurisdiction requirements, and a private support contact before launch**. The GitHub Issues link is only for non-sensitive bug reports, never personal or billing information.

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
