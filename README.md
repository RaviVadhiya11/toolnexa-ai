# ✦ ToolNexa AI

Professional responsive all-in-one online tool website built with **Next.js 15, React 19, TypeScript, Tailwind CSS, pdf-lib and qrcode**.

## Included
- Responsive blue/violet SaaS homepage, tool catalog, search and category filters
- Dark and light themes, mobile bottom navigation
- Dashboard with recent local activity; pricing page with future plans
- 20 browser-based tools across Text, Developer, Business, Image, PDF

### Phase 1 tools
**Text:** Word Counter, Case Converter, Text Reverser.
**Developer:** Password Generator, UUID Generator, JSON Formatter, Base64 Encoder, URL Encoder.
**Business:** QR Code Generator, GST Calculator, Percentage Calculator, Profit Margin Calculator.
**Image:** Image Resizer, Image to PNG, Image to JPG, Image to WebP.
**PDF:** Image to PDF, Text to PDF, Merge PDF, Split PDF (page extraction).

## Local development
```bash
npm install
npm run dev
```
Open http://localhost:3000. To check production: `npm run build`, then `npm start`.

## Current limitations
This repository contains a **functional MVP implementation, not a verified production release**. The build and browser test suites need to be run before launch. Dependencies were not successfully installed in the authoring environment.
- Real AI integration, login/accounts, subscriptions, payments, admin panel, server-side processing and AI credits are **not implemented**.
- Image conversion via Canvas may lose metadata/animation. PDF files with unsupported encryption may fail. Max 25 MB per file, up to 15 PDFs in Merge, 20 images in Image to PDF.
- Text-to-PDF currently supports basic ASCII; non-Latin script is replaced. Add Unicode font embedding before claiming Hindi/Gujarati text support.
- Split PDF extracts selected pages into **one output PDF**, not a ZIP of individual pages.
- PDF and image tools process locally in your browser; no upload API exists.
- Before release add security, accessibility, browser tests, automated CI, privacy/legal pages, robust error handling and usage limits.

## Next steps
1. Install dependencies, build, test functionality on desktop and mobile.
2. Add authentication, database-backed dashboard and secure server APIs.
3. Implement AI models, usage credits, cost caps and production payments.
4. Add analytics, SEO tool landing content, policy pages and production deployment.
