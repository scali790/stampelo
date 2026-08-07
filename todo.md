# Stampelo — Project TODO

## Phase 1: Database, Stripe, Infrastructure
- [x] Database schema: designs, orders, templates, icons tables
- [x] Stripe integration setup (webdev_add_feature)
- [x] i18n locale files (en.ts, de.ts)
- [x] Global CSS design tokens and typography

## Phase 2: Stamp Editor Core
- [x] Stamp editor route /editor
- [x] SVG canvas component with grid background
- [x] Shape selector: round, oval, rectangular, triangular
- [x] Size configuration (10–150 mm)
- [x] Multi-stamp canvas with thumbnail list
- [x] Zustand editor state store
- [x] Frame/ring element with radius, stroke-width, line-break sliders
- [x] Text-on-path element (circle, triangle, rectangle) with font/size/bold/italic/align/inverse/radius/spacing/start-point
- [x] Center text element with font/size/X/Y position
- [x] Image/icon element with position and scale controls
- [x] Global color picker + per-element color override
- [x] Element z-order controls (up, down, copy, delete)
- [x] Properties panel (contextual, right sidebar)
- [x] Element list panel (layers panel)
- [x] Add element toolbar (top bar)

## Phase 3: Template & Icon Library
- [x] 30+ template categories with 300+ designs (JSON data)
- [x] Template browser with category filter and search
- [x] Template load into editor
- [x] Built-in SVG icon library (categorised, 20+ icons seeded, expandable)
- [x] Icon search and category filter
- [x] Custom SVG upload (max 50 KB, client-side sanitisation)

## Phase 4: Preview, Share, Effects
- [x] Client-side watermarked SVG preview
- [x] Shabby/aged SVG filter effect
- [x] Gold metallic effect
- [x] Silver metallic effect
- [x] "Send layout by email" flow (persists full design state, return link restores editor)
- [x] Save design to DB (guest + authenticated)
- [x] Share link generation

## Phase 5: Export Pipeline & Stripe Checkout
- [x] Stripe Checkout session creation (4 plans: PROMO $2.50, ECONOM $3.50, PREMIUM $4.50, VIP $5.50)
- [x] Stripe webhook handler (idempotent fulfillment)
- [x] Server-side PNG export at 600 dpi (Sharp)
- [x] SVG export (clean, production-ready)
- [x] EPS export
- [x] PDF export (pdf-lib)
- [x] DOCX export (stamp embedded in Word document)
- [x] Signed time-limited download URLs (S3 presigned)
- [x] Email delivery of download links (Resend)
- [x] Download page (/download)

## Phase 6: PDF Editor Module
- [x] PDF upload (client-side, max 20 MB)
- [x] PDF page viewer (PDF.js)
- [x] Stamp placement on page (drag/resize/rotate)
- [x] Multi-page navigation
- [ ] Export stamped PDF (requires server-side PDF merge — post-launch)
- [ ] Checkout flow for PDF stamping (post-launch)

## Phase 7: User Accounts
- [x] Registration and login (Manus OAuth)
- [x] User profile page
- [x] Saved designs list with load
- [x] Purchase history with repeat-download access
- [ ] Admin panel (order management, template management) — post-launch

## Phase 8: Marketing & SEO
- [x] Marketing landing page (hero, features, pricing, FAQ, testimonials, CTA)
- [x] Pricing section with plan comparison
- [x] FAQ accordion
- [ ] Template showcase gallery (post-launch)
- [ ] Use-case landing pages (post-launch)
- [x] i18n EN/DE language switcher
- [x] SEO meta tags, Open Graph, sitemap.xml, robots.txt
- [x] Legal pages (Privacy Policy, Terms of Service, Refund Policy)

## Phase 9: QA & Polish
- [x] Vitest unit tests (7 tests passing)
- [ ] Mobile responsive editor (post-launch)
- [ ] Cross-browser testing (post-launch)
- [ ] Performance optimisation (post-launch)
- [ ] Accessibility audit (post-launch)
- [x] Final checkpoint and delivery
