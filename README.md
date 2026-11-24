# ToolNexa AI

ToolNexa AI is a responsive web application built with Next.js 15, React 19, TypeScript, Supabase Auth, PayPal subscriptions, pdf-lib, and qrcode. It has 60 utility tools plus a paid Batch Text Analyzer.

Production site: https://toolnexa-ai.vercel.app

## Features

- Design 6 dark-navy and purple responsive interface, optional light theme, desktop sidebar and mobile navigation.
- 60 utilities across Text, Developer, Business, Image, PDF and Creator. New utilities include JSON-to-CSV with formula-injection protection, SHA-256/SHA-512 file verification, UTM Campaign URL Builder, SEO Meta Tags Generator, verified local AES-256 PDF encryption, Creator aspect resizing and public YouTube thumbnails. The title/hashtag generator now supports a guarded Google Gemini Flash-Lite AI Mode (when securely configured) and a separate transparent Offline Smart Mode. Multi-item outputs provide one-tap individual Copy buttons wherever meaningful, in addition to whole-result copying and downloads.
- Gemini AI Mode is optional, server-only and disabled by default until GEMINI_API_KEY and GEMINI_AI_ENABLED=true are configured. Authenticated users are limited to 3 model generations/day and the whole site to 30 model generations/day, in addition to the normal tool-run quota. The Free API provider may still return its own 429 / 503 errors. Free-tier prompts may be used by Google for product improvement; never submit sensitive user content. See app/api/ai/social/route.ts and supabase/migrations/20261123_social_ai_free_quotas.sql.
- Shared daily runs: Free 3, Starter 500, Pro 1,000, Premium 1,500; resets at 00:00 UTC. Guests use a per-browser counter. Authenticated accounts can share an atomic Supabase counter across browsers/devices after the SQL migration and environment flag are applied. Server-verifies PayPal plan and account identity; local execution remains browser-based, so browser tampering can still bypass the UI. Paid-account reservations count on a run attempt, including operations which later fail; guest usage only counts successful runs.
- Search, category filters, helpful tool landing pages and local recent-tool history.
- Sign up/sign in with Supabase Auth, Google OAuth where configured, email confirmation and email password reset.
- Paid Starter ($3.99/month or $39.99/year, 20 texts per batch), Pro ($5.99/month or $59.99/year, 60 texts), Premium ($9.99/month or $99.99/year, 150 texts) and Max ($14.99/month or $149.99/year, 300 texts). Annual prices are billed upfront every 12 months and save about 16% versus monthly billing. Paid batch analyzer limit is 20,000 characters per text. **Pro, Premium and Max also unlock HD 2×/4× PNG exports in Image & Vector Studio Suite; this is not generative AI enhancement. No paid AI credits are included.**
- Server-verified PayPal membership, signed webhooks, hosted subscription fallback, customer subscription overview and immediate cancellation request.
- SEO metadata, sitemap, robots, accessible error screens, security headers and public support/policy pages.

Max is the highest **capped** tier: **$14.99/month or $149.99/year**, with **3,000 daily tool runs** (UTC reset) and up to **300 texts per Batch Text Analyzer request**. It replaces the former planned Unlimited offer. No current plan includes unlimited AI generations, unlimited tool runs, or paid AI credits. The Gemini signed-in preview remains independently limited to 3 generations per day per account and 30 per day site-wide.

## Vector Studio and Image Enhancer

- `/studio/vector`: upload JPG/PNG/WebP (up to 10 MB), trace image colors into actual SVG paths using ImageTracer.js, preview raster vs vector, and export editable SVG and standard PNG in the browser. Pro HD PNG is server-verified. An optional SVG preset-logo designer remains available. Complex photos trace into stylized vector art and are not pixel-identical.
- `/studio/enhance`: browser-only brightness/contrast/saturation tools; HD JPEG upscaling uses a protected server endpoint and Lanczos resampling, **not** generative AI restoration or detail hallucination.
- Pro HD exports check the current PayPal ACTIVE subscription on the server, enforce the shared account daily quota atomically and reject unauthenticated or Starter requests. Inputs are limited to 700,000 pixels before 2×/4× resizing; up to 12 megapixels output. Vercel's response-size limit may require a smaller export for dense artwork.
- These eight dedicated Studio pages are outside the existing 60 utility catalogue. SVG, vector PDF, EPS and outline DXF are implemented; native AI, CDR, WMF and EMF still require specialist converters.

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

For missing monthly/annual PayPal Plan IDs, use the merchant-only **dry-run-first** helper `scripts/paypal-provision-plans.mjs` and follow [PAYPAL_SETUP.md](PAYPAL_SETUP.md). The helper needs a real PayPal Business product and private credentials, refuses live creation without an explicit acknowledgement, and never enables checkout. **No actual Plan ID exists until PayPal creates one.**

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


## Eight-tool Image & Vector Suite (November 2026)

Routes: /studio/vector, /studio/image-to-vector, /studio/convert, /studio/svg-editor,
/studio/enhance, /studio/background-remove, /studio/retouch, /studio/restore.
The original 60 utility tools remain untouched; these 8 dedicated Studio workflows
live outside that static catalogue.

- Vector conversion: sanitized local SVG -> editable SVG, vector PDF via svg2pdf.js,
  EPS PostScript geometry, or DXF CAD polylines (outlines only). Flatten SVG
  transforms before EPS/DXF; advanced SVG constructs may be unsupported.
- Background remover: on-device Apache-2.0 U²-Netp ONNX model via ONNX Runtime Web;
  first run downloads 4.6MB model from Hugging Face and WASM assets from jsDelivr.
  Solid-background mode works without the AI model.
- Retouch: selection brush and neighborhood pixel inpainting for small objects.
  Not generative removal of people, crowds or complex scenes.
- Photo Restore: median denoise, sharpen and tonal grading. Not generative
  photo recreation or semantic black-and-white colourization.
- Standard photo exports run entirely in the browser. Pro/Premium/Max 2x/4x
  HD exports (PNG for vector/alpha images; JPEG for photos) are server-verified
  against current PayPal subscriptions and consume paid daily run quota.
- Native .AI, .CDR, .WMF and .EMF writing is **not implemented**; never fake these
  formats by renaming SVG/EPS. They require tested third-party conversion.
- AI model availability depends on user browser/CORS/network; the local fallback
  is documented in the tool UI.


## Free 3 Daily and Upscale up to 8K (November 2026)

- All original 60 utility tools and 8 Studio workflows share the same **3 Free runs per UTC day**. Guests use a per-browser local counter, and signed-in users share the server account quota when enabled. Browser-only quotas are not tamper-proof.
- Each Studio processing/conversion operation, including a Free upscale preview, consumes one shared daily run before processing. Repeated download clicks for the same generated upscale do not consume another run. Separate server-generated HD exports keep their existing paid quota.
- **Upscale Image** works for Free users (3 shared previews/day) and for all paid plans, regardless of resolution. It creates a capped 720-pixel, watermarked preview first without allocating a memory-heavy 4K/8K export canvas. Clicking **Download Upscaled** verifies an ACTIVE PayPal subscription server-side; only after authorization does the browser generate and download the selected full-resolution output. unsubscribed users see a plan modal and no file is downloaded. Starter can download 2×, Pro adds 4×/4K, Premium/Max add 8K. Pricing opens in a new tab to preserve the original preview; the user returns and clicks Download again after activation. Browser-side image processing cannot prevent advanced local pixel inspection.
- 4K/8K exports preserve aspect ratio and fit inside a 3840×2160 / 7680×4320 landscape bounding box (portrait equivalent). Output is generated via browser canvas high-quality interpolation; not generative AI super-resolution and does not reconstruct hidden detail. 8K may fail on memory-limited devices.
- Existing paid daily caps remain Starter 500, Pro 1000, Premium 1500, Max 3000.


## Image Enhancer: photo-quality controls and optional neural enhancement (Nov 2026)

- /studio/enhance now presents a 10 MB JPG/PNG/WebP drag-and-drop image uploader, max 4000x4000 source, image mode presets (Photo/Portrait/Product/Graphic/Old Photo), brightness, contrast, saturation, noise reduction and sharpening.
- Responsive before/after comparison slider previews colour and detail improvements in the browser. 'Auto Enhance' selects a balanced photo preset.
- The existing shared Upscale Image panel keeps 2x, 4x, 4K and 8K resolution choices. Free users can process previews using the shared 3 daily runs, while full-sized downloads require verified PayPal subscriptions at the applicable tier.
- For photo inputs only, **AI Detail (experimental)** uses the MIT-licensed UpscalerJS neural network + default ESRGAN-Slim 2x model, running locally in TensorFlow.js. The neural input is capped to 320 px on phones or 480 px on larger screens. Further scaling to requested output dimensions uses conventional canvas resampling. This is a real learned enhancement step, but it cannot guarantee true reconstruction of a lost image detail.
- **Classic HD** remains the default and is faster. If the neural model fails to download, a browser has inadequate memory, or the model runtime is unavailable, user can choose Classic and retry. Model weights may be downloaded from the UpscalerJS public CDN, while the photo is processed on device.
- Browser-side generated pixels are not cryptographically protected; UI subscription gating is intended for ordinary usage and must not be represented as tamper-proof DRM.


## Creator Studio V3 — professional editing controls (November 2026)

The eight Image & Vector Studio routes now have the same premium visual navigation and stronger real editing controls, while the original 60 utility tools remain untouched.

- **All eight tools:** unified upload workspace with draggable before/after **Split**, keyboard preview comparison, zoom from 100% to 250%, white/dark/checkerboard canvas options, replace/reset and a mobile-friendly quick tool switcher.
- **Background Remover:** U²-Netp/offline background separation, Erase/Restore alpha mask brushes, 12-stroke undo/redo history, your own JPG/PNG/WebP background photograph, transparent/white/color/gradient presets, subject repositioning and strength-adjustable soft shadows. Processing remains on-device.
- **Retouch:** brush-selection undo/redo up to 20 strokes; genuine neighborhood pixel healing (not generative object deletion).
- **Photo Restore:** balanced/portrait/old-scan/vintage settings and genuine histogram 1%/99% automatic tone stretching, alongside denoise, sharpen and tonal color filters (not trained historical color inference).
- **Image to Vector:** logo/illustration/poster/photo-art presets; up to 48 quantized colors, three tracing resolutions (up to 900px), an adjustable path smoothness effect, real editable SVG output.
- **SVG Editor / Converter:** editing can be undone/redone up to 30 steps; star/circle/rectangle generation, opacity, palette swatches, horizontal/vertical geometric mirroring; SVG/PDF/EPS/DXF output restrictions remain accurate (transformed SVG will not export to EPS/DXF via the existing path-converter).
- **Logo Vector Studio:** six generated scalable SVG designs, five brand color palettes and selectable transparent, white or dark artboard.
- **Photo Enhancer:** image-content analysis for automatic exposure and contrast, real warmth channel shifts, existing neural AI Detail (experimental), denoise/sharpening and paid resolution exports.

Existing business rules are unchanged: Free has three shared daily uses, and downloads from the 2×/4×/4K/8K upscaler are subscription-gated; 8K requires Premium/Max. Automated tests verify code and builds; claims of proven mobile AI cutout quality, browser-robust 8K, tamper-proof browser processing or real PayPal payment completion require separate real-device/end-to-end testing.

### Premium export popup UX (November 24, 2026)
All eight Studio workflows use the same resolution-gated premium upscaler. Its Download button stays clickable even without a generated preview; Free and insufficient-plan accounts are shown a Starter/Pro/Premium/Max selection modal, with eligible plans linked to `/pricing?plan=<tier>` in a new tab so local image state survives PayPal checkout. After subscription activation, return to the unchanged editor tab and press Verify & Download or Download again. The server checks ACTIVE PayPal membership each time. Existing Pro HD exports for Logo Studio, vector tracing, and Background Remover/Retouch/Restore also use the shared modal; standard exports remain free as before. A low-memory browser may still be unable to allocate the paid high-resolution canvas even after verification, and that case reports an error rather than silently handing out a lower-resolution file.


## Studio V4 reference-inspired interface, applied site-wide (24 November 2026)

The creator supplied an HTML *demo*, which has been used as a visual/interaction reference—not installed as an insecure, standalone payment or image-processing backend. The production code keeps the existing real image-processing engines and PayPal checks.

- **All 60 utilities**: shared responsive dark glass panels, cyan/violet controls, clear quota indicators, modern tool cards, and a new private local image/file preview in both the basic and advanced utility runners.
- **All eight Studio tools**: consistent dark workspace with the same drag/drop file stage, split before/after comparison, press-and-hold original, Fit and 2× Inspect, canvas grids, upgraded two-column desktop and stacked mobile layouts. When supported by an uploaded-file stage, a successful upscale also appears in that original stage as a watermarked preview.
- **Image Enhancer**: reference-inspired large sticky preview at left, presets, real Auto Analyze and tone/sharpen sliders at right, three clearly labelled *procedural illustration* samples and real processing controls.
- **Shared upscale**: actual 2× / 4× / 4K / 8K resolution cards, on-device AI Detail / classic engine choices, real JPEG/PNG/WebP output formats, quality slider, and non-fake asynchronous phase display. Full-resolution pixels are generated only after server verification of the right active PayPal membership. Ineligible accounts see a real plan popup rather than a fake local unlock.
- **Privacy and limitations**: the uploaded demo's “Cloud AI GPU (Real-ESRGAN v4)”, unlimited usage, local Pro-unlock, and Indian UPI options are **not** functioning paid backend services and are **not claimed** or enabled here. This website uses its existing on-device browser model (experimental), signed-in PayPal subscriptions, and the established 3 Free shared daily uses. 8K output may require a high-memory browser.

Run automated tests and Next.js builds before releasing. Mobile/browser behavior and a real paid customer checkout–webhook–download sequence still require separate end-to-end acceptance testing.


## Flagship Pro+ reference redesign (2026-11-24)

The second user-provided reference, \`toolnexa_ai_pro_flagship_ai_studio_60_tools.html\`, is a design prototype. The live site now adapts its obsidian/dark, cyan/indigo with gold accents, compact top navbar, responsive navigation, Ctrl/Cmd+K searchable command palette, split interactive comparison hero, universal hero image upload, Studio bento cards, tool directory, comparison table, real multi-plan pricing view and professional dashboard shortcuts.

### Functional implementation
- **Hero upload transfer** keeps the File only in memory during client-side navigation to the real Enhance editor. It does not upload or persist the original image. The homepage before/after sample is openly labelled as a procedural illustrative filter demo, not a neural 8K result.
- **60 core utility tools** retain their existing tested, quota-limited browser-first processing, with shared premium V4/V5 styling. **Eight original Studio tools** retain their real workflows, and a **new ninth Batch Pro+ image workspace** was added at \`/studio/batch\`.
- **Batch Pro+** processes at most eight JPEG/PNG/WebP images, at most 10 MB each. Each image uses a shared daily tool run, and its full-size export is allowed only after \`/api/studio/upscale-authorize\` verifies an active **Premium or Max** subscription with live PayPal membership. Source files are processed sequentially using Canvas locally. Each processed image is packed into one standards-conforming ZIP (CRC32 / central directory), in one browser download. Device and memory limits remain relevant; outputs apply conventional filters and interpolation, not cloud super-resolution.
- **Real pricing** remains in USD with verified recurring PayPal plans: Starter, Pro, Premium and Max. Free remains **3 shared runs/day** and paid daily limits are 500 / 1,000 / 1,500 / 3,000. No fake Pro+/Max toggle, unlimited credits, demo-only checkout activation, unverified INR/UPI/Razorpay billing or fictitious GPU performance claims were shipped.
- **Command palette** uses the existing real tool slugs and Studio routes; Ctrl/Cmd+K opens search, arrow keys navigate, Enter opens a real page and Escape closes.

Build/automated tests should be verified on GitHub Actions and Vercel before merging. Browser/mobile and real merchant capture plus webhook delivery remain separate end-to-end acceptance tests.


## Passport & Social Size Studio (24 November 2026)

Production route: `/studio/passport-social` — tenth Creator Studio workspace. The user-provided `toolnexa_passport_social_studio_demo.html` is the visual and baseline feature reference.

- Four passport examples: 35×45 mm, 2×2 inches, 50×70 mm, 15–150 mm custom. Twelve social outputs: Instagram post/portrait/story, YouTube thumbnail and avatar, LinkedIn cover, profile icon, TikTok, Pinterest, Facebook cover, X header and custom 128–4096 pixel sizes.
- Browser-only live sample (clearly marked illustration), private JPG/PNG/WebP upload, drag/reposition, zoom, rotation, brightness/contrast/saturation and actual PNG/JPG/WebP downloads. The original photo is not uploaded to the server for the standard editor.
- Real local U²-Netp AI cutout (loads external model weights) and an offline solid-color background option. Background colors are only visible once a transparent subject cutout is made. AI processing uses a capped working resolution; inspect edges carefully.
- Exact physical 4×6-inch sheet layout at 300 PPI (1200×1800) with actual-size tile placement and no hidden shrinking. For Pro/Premium/Max: 600-PPI passport output, true 4×6-inch 600-PPI print PDF using jsPDF, and 2× social exports after `/api/studio/upscale-authorize` validates the active PayPal subscription. Integrated shared StudioUpscalePanel also provides 2×/4×/4K/8K according to tier.
- Uses `studio-passport-social` in the existing 3 Free daily shared-use enforcement (and server account quota where enabled). Each successful export starts after a reserved daily usage operation. Server membership checks do not send pixel data.
- Passport sizes are samples, NOT biometric or jurisdiction compliance tests. The app cannot guarantee acceptance, automatic face positioning, photo print metadata, or real AI facial reconstruction. PNG/JPG physical PPI metadata may differ from the target; choose PDF actual-size printing for a paper 4×6 inch sheet.

Inspect Vercel Preview, automated tests and PayPal live configuration audit before production merge. Real merchant checkout, phone camera captures, first AI model download and paper printing should be verified manually.
