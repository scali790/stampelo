# Open Items / Backlog

**Last updated:** 2026-08-07

## P0 — LAUNCH BLOCKERS

- [ ] **Stripe webhook secret registration** — `STRIPE_WEBHOOK_SECRET` must be set in Vercel. Obtain from Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret. Without this, webhook signature verification fails and no orders are fulfilled.
- [ ] **Download IDOR — Broken Object Level Authorization (SECURITY)** — `orders.id` is a sequential PostgreSQL serial primary key. `order.getByOrderId` is a `publicProcedure` with no authentication check and returns `downloadUrls`. Vercel Blob files are public. An attacker can enumerate `orderId=1,2,3...` to retrieve any customer's download URLs without authentication. This is a confirmed IDOR vulnerability. **Must be fixed before public launch.** See `docs/SECURITY.md` for full attack vector and required remediation. Required fixes: (1) `getByOrderId` must check `order.userId === ctx.user.id`; (2) guest purchases need a high-entropy `downloadToken`, not the sequential order ID; (3) download delivery must require authenticated ownership or a valid guest token; (4) prefer private Blob storage with an authorized download proxy. Required tests: user A cannot access user B's order, anonymous enumeration denied, invalid guest token denied, valid guest token scoped to its own order only.
- [ ] **Real Stripe test payment E2E** — Full checkout → webhook → fulfillment → email → download flow not yet smoke-tested on current production build.
- [ ] **Real Google sign-in smoke test** — Google OAuth flow not verified on current production deployment. Auth HTTPS URLs are confirmed fixed (trust proxy + AUTH_URL deployed), but the full Google sign-in round-trip has not been completed end-to-end.

## P1 — HIGH PRIORITY

- [ ] **Export verification on production** — PNG/SVG/PDF/DOCX generation not verified on current Vercel build. The `sharp` native binary packaging may have issues on the current deployment. EPS is not a customer export and does not require verification here.
- [ ] **PDF editor production smoke** — Upload → merge → download not verified on current Vercel production.
- [ ] **Editor viewport UX — stamp plate fit** — The editor workspace has been updated (commit `8462fee`) but the fix has not yet been verified in production. The intended behavior is: stamp plate fills ~75–82% of the central workspace, no large white generic page/canvas, grid behind the stamp, physical dimensions unchanged. Verify after deployment that a 38mm round stamp appears large and centered with no scrollbars.
- [ ] **Properties panel bug** — Properties panel may still show "Select an element" when an element is selected. Possible event propagation issue between canvas click (deselect) and layer panel click (select). Not yet verified on current production build.
- [ ] **EPS plan decision** — `generateEps()` exists in `server/exportService.ts` but is not wired into any plan. Decision required: (a) add EPS to VIP plan, (b) add as a separate add-on, or (c) remove the generator. Until decided, EPS must not be listed as a customer-facing export in any documentation or marketing material.

## P2 — ENHANCEMENTS

- [ ] **Analytics** — Umami analytics removed (was causing HTTP/2 errors from Manus-internal endpoint). No replacement analytics configured.
- [ ] **Cross-browser verification** — Playwright E2E tests exist but not run against current production build.
- [ ] **Stripe webhook event monitoring** — Set up Stripe Dashboard alerts for failed webhook deliveries.
- [ ] **Admin panel smoke test** — Admin panel functionality not verified on current production.
- [ ] **PDF upload size limit** — Vercel serverless functions have a 4.5 MB body limit by default. Large PDFs may fail. Consider streaming upload or increasing the limit.

## P3 — FUTURE

- [ ] Use-case landing pages (medical, legal, wedding, notary)
- [ ] Competitor GEO/SEO strategy and keyword research
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Template showcase gallery page for SEO
- [ ] PDF checkout flow (purchase stamp directly from PDF editor)
- [ ] Structured data markup (Schema.org)
- [ ] Multi-language URL routing (`/de/` prefix)
- [ ] Thumbnail pre-generation for all templates server-side

## RESOLVED (2026-08-07)

- [x] **Auth HTTPS callback URLs** — `app.set("trust proxy", true)` applied and deployed. `/api/auth/providers` now returns `https://` URLs. `AUTH_URL=https://www.stampelo.com` confirmed set in Vercel.
- [x] **Account page React hook-order regression (error #310)** — All `useState` and other hooks moved to top of component before any conditional return. Regression test added. Fix deployed.
- [x] **Resend magic link email delivery** — New Resend API key created with Sending access scoped to `stampelo.com`. Magic link emails now delivered successfully.
- [x] **Template previews showing "No preview"** — TemplateDrawer updated to generate SVG previews client-side from `stateJson` using `renderStampSvg()`. All 318 templates now show live previews.
- [x] **textPath defs clipping** — `<path>` definitions for text-on-path are now hoisted to the top-level `<defs>` section, outside the clip group.
