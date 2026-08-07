# Open Items / Backlog

## P0 — LAUNCH BLOCKERS

- [ ] **Stripe webhook secret registration** — `STRIPE_WEBHOOK_SECRET` must be set in Vercel. Obtain from Stripe Dashboard -> Developers -> Webhooks -> your endpoint -> Signing secret. Without this, webhook signature verification fails and no orders are fulfilled.
- [ ] **Real Stripe test payment E2E** — Full checkout -> webhook -> fulfillment -> email -> download flow not yet smoke-tested on current production build.
- [ ] **Real Google sign-in smoke test** — Google OAuth flow not verified on current production deployment.

## P1 — HIGH PRIORITY

- [ ] **Export verification on production** — PNG/SVG/EPS/PDF/DOCX generation not verified on current Vercel build (sharp binary packaging may have issues).
- [ ] **PDF editor production smoke** — Upload -> merge -> download not verified on current Vercel production.
- [ ] **Editor viewport UX verification** — Auto-fit zoom and measurement grid deployed but not yet verified in production. Confirm stamp renders large and centered, text-on-path renders correctly, Properties panel shows element properties when element is selected.
- [ ] **Properties panel bug** — Properties panel may still show "Select an element" when element is selected. Possible event propagation issue between canvas click (deselect) and layer panel click (select).

## P2 — ENHANCEMENTS

- [ ] **Analytics** — Umami analytics removed (was causing HTTP/2 errors). No replacement analytics configured.
- [ ] **Cross-browser verification** — Playwright E2E tests exist but not run against current production build.
- [ ] **Stripe webhook event monitoring** — Set up Stripe Dashboard alerts for failed webhook deliveries.
- [ ] **Admin panel smoke test** — Admin panel functionality not verified on current production.
- [ ] **PDF upload size limit** — Vercel serverless functions have a 4.5 MB body limit by default. Large PDFs may fail.

## P3 — FUTURE

- [ ] Use-case landing pages (medical, legal, wedding, notary)
- [ ] Competitor GEO/SEO strategy and keyword research
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Template showcase gallery page for SEO
- [ ] PDF checkout flow (purchase stamp directly from PDF editor)
- [ ] Structured data markup (Schema.org)
- [ ] Multi-language URL routing (`/de/` prefix)
- [ ] Thumbnail pre-generation for all templates server-side
