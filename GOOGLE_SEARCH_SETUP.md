# ToolNexa AI — Google Search launch guide

**Canonical website:** https://toolnexaai.com  
**XML sitemap:** https://toolnexaai.com/sitemap.xml  
**Crawling policy:** https://toolnexaai.com/robots.txt

## What is automated

- The site enables indexing only when production has `SITE_PUBLIC_LAUNCH_ENABLED=true`.
- The sitemap includes the homepage, About, Tools, Creator Studio, Pricing, Privacy, Terms, Billing, Support, 60 utility tool pages and 11 Creator Studio detail pages.
- Canonical URLs point to `https://toolnexaai.com`; legacy `toolnexa-ai.vercel.app` browser URLs redirect permanently.
- Private account, subscription, checkout and API routes are omitted from the sitemap and protected by robots / noindex headers.
- Each utility tool has a unique title and description, canonical URL, and breadcrumb + WebApplication structured data. The main site has WebSite and Organization structured data.
- `GOOGLE_SITE_VERIFICATION` is an optional **server-side** production environment variable used by Next.js for a Search Console meta tag when the URL-prefix verification method is chosen.

## Manual Google Search Console ownership verification (required)

1. Open https://search.google.com/search-console/ and sign in to the Google account you want to use for the website.
2. Select **Add property** → **Domain**.
3. Enter only `toolnexaai.com` (no https:// and no path).
4. Google supplies a **TXT verification record**. Copy the complete value beginning with `google-site-verification=`.
5. In Spaceship → Domain Manager → `toolnexaai.com` → DNS, add a **TXT** record with Host `@` and the exact Google-provided value. Keep existing A and CNAME records unchanged.
6. Save, then return to Search Console and press **Verify**. DNS changes can take time to propagate. Do not invent a verification TXT token.

## Submit the sitemap

1. In Search Console select the verified `toolnexaai.com` property.
2. Open **Indexing → Sitemaps**.
3. Under **Add a new sitemap**, enter `sitemap.xml` (or the full absolute URL if that UI asks for it).
4. Press **Submit** and review the resulting status.

## Request indexing for important pages

Use **URL Inspection → Test live URL → Request indexing** for:
- https://toolnexaai.com/
- https://toolnexaai.com/tools
- https://toolnexaai.com/studio
- https://toolnexaai.com/about
- https://toolnexaai.com/pricing

Google decides when to crawl, index and rank pages. Requesting indexing or submitting a sitemap does **not** guarantee any indexed result or ranking. Monitor the Page Indexing and Search Performance reports.

## After launch

- Review Search Console crawling and indexing errors.
- Keep public pages reachable with HTTP 200 and useful, distinct content.
- Keep original legal and payment promises accurate; update support docs when plans or limits change.
- Do not submit `/login`, `/signup`, `/dashboard`, `/admin`, `/auth`, `/subscribe`, `/api` or premium-only internal pages for indexing.
- If using Google Analytics 4, connect it only after deciding on consent and privacy requirements.
