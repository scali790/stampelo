# Open Items / Backlog

**Last updated:** 2026-08-07

## P0 — LAUNCH BLOCKERS

- [ ] **Stripe webhook secret registration** — `STRIPE_WEBHOOK_SECRET` must be set in Vercel. Obtain from Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret. Without this, webhook signature verification fails and no orders are fulfilled.
- [ ] **Download IDOR — Broken Object Level Authorization (SECURITY)** — `orders.id` is a sequential PostgreSQL serial primary key. `order.getByOrderId` is a `publicProcedure` with no authentication check and returns `downloadUrls`. Vercel Blob files are public. An attacker can enumerate `orderId=1,2,3...` to retrieve any customer's download URLs without authentication. This is a confirmed IDOR vulnerability. **Must be fixed before public launch.** See `docs/SECURITY.md` for full attack vector and required remediation. Required fixes: (1) `getByOrderId` must check `order.userId === ctx.user.id`; (2) guest purchases need a high-entropy `downloadToken`, not the sequential order ID; (3) download delivery must require authenticated ownership or a valid guest token; (4) prefer private Blob storage with an authorized download proxy. Required tests: user A cannot access user B's order, anonymous enumeration denied, invalid guest token denied, valid guest token scoped to its own order only.
- [ ] **Real Stripe test payment E2E** — Full checkout → webhook → fulfillment → email → download flow not yet smoke-tested on current production build.
- [ ] **Real Google sign-in smoke test** — Google OAuth flow not verified on current production deployment. Auth HTTPS URLs are confirmed fixed (trust proxy + AUTH_URL deployed), but the full Google sign-in round-trip has not been completed end-to-end.

## P1 — HIGH PRIORITY

- [x] **Export verification on production** — RESOLVED 2026-08-08. Sharp replaced with @resvg/resvg-wasm. PNG/PDF export verified working. EPS not a customer export.
- [ ] **PDF editor production smoke** — Upload → merge → download not verified on current Vercel production.
- [x] **Editor viewport UX — stamp plate fit** — RESOLVED 2026-08-08. EditorStage (max 600×600px) with auto-fit zoom. Stamp fills ~75% of stage. Cropped viewBox prevents overflow. Grid behind stamp. Physical dimensions unchanged. Commits: 8462fee, 2e1e00f, caaa61c, ccd868f.
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
- [x] **Arc text clipping (final glyph truncated)** — RESOLVED 2026-08-08. Two root causes: (1) text-on-path was inside the clip-path group; (2) text overflowed the arc. Fix: text-on-path rendered outside clip group;  auto-reduces fontSize/letterSpacing to fit available arc length. Commit: 3033184.
- [x] **Image button non-functional** — RESOLVED 2026-08-08. Image button had empty . Now opens . Commit: 46dd30b.
- [x] **NaN in stamp dimensions** — RESOLVED 2026-08-08. Size inputs now guard against NaN — store only updated when value is valid number in [10, 150]. Commit: 46dd30b.
- [x] **PDF editor export 500 error** — RESOLVED 2026-08-08.  was returning a relative path instead of a full URL. Fixed:  uses  for actual URL;  returns full blob URL;  uses it directly. Commit: bb63921.
- [x] **PDF editor stamp display too small** — RESOLVED 2026-08-08. Stamp overlay now uses  with cropped viewBox, proportional to page width. Commit: bb63921.
- [x] **PDF editor no-stamp gate** — RESOLVED 2026-08-08. Users visiting /pdf-editor without a stamp now see a clear gate with CTAs. Commit: 1a39c30.
- [x] **PDF editor rotation handle feedback loop** — RESOLVED 2026-08-08. Rotation was computing an absolute angle from stamp center, creating a feedback loop as the stamp rotated. Fixed by storing initial angle at drag start and computing delta. Commit: 05252ae.
- [x] **PDF editor export Sharp @img/colour missing** — RESOLVED 2026-08-08. Build script only copied @img/sharp-linux-x64 but not @img/colour (pure JS, required by sharp/dist/colour.mjs). Fixed by copying entire node_modules/@img/ directory and detect-libc. Commit: fc69a75.
- [x] **Server cold-start crash (createRequire duplicate)** — RESOLVED 2026-08-08. Sharp's ESM module declared `createRequire` at module scope, conflicting with the esbuild `--banner:js` injection. Fixed by replacing Sharp entirely with `@resvg/resvg-wasm` in both `exportService.ts` and `pdfStampService.ts`. Commit: `52159be`.
- [x] **PDF stamp export size mismatch** — RESOLVED 2026-08-08. Server was computing stamp size from physical DPI × scale (2.7× too large). Fixed by sending `stampSizePct` from client (stamp display width as % of canvas width) and using it directly as a fraction of PDF page width. Commit: `a960b07`.

