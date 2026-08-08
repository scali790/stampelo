# Stampelo SEO/GEO Implementation Status

Canonical strategy: `docs/SEO_GEO.md`
Canonical execution roadmap: `docs/SEO_GEO_IMPLEMENTATION.md`
Status date: 2026-08-08

Legend: ✅ implemented/verified in code or production-preview · 🟡 operational/external dependency · ⏳ pending final production benchmark

| ID | Work item | Status | Evidence / note |
|---|---|---|---|
| SEO-00 | Canonical roadmap and live-audit state | ✅ | `SEO_GEO_IMPLEMENTATION.md` added; former 525 outage recorded as resolved. |
| SEO-01 | Crawlable public rendering architecture | ✅ | Build-time route HTML generated for public SEO pages. |
| SEO-02 | Route-aware metadata | ✅ | Unique title, description, canonical and OG metadata per generated route. |
| SEO-03 | Real HTTP 404 | ✅ | Vercel output routes unknown URLs to `404.html` with status 404. |
| SEO-04 | Canonical / robots / sitemap hardening | ✅ | Automated build verification covers canonical and private-route exclusions. |
| SEO-05 | Homepage canonical entity | ✅ | Visible homepage and prerendered HTML use canonical entity facts. |
| SEO-06 | Homepage GEO answer blocks | ✅ | Visible fact blocks added. |
| SEO-07 | Homepage How it works | ✅ | Five-step factual process added. |
| SEO-08 | JSON-LD foundation | ✅ | Organization, WebSite, WebApplication plus page-type schema. |
| SEO-09 | Trust claim audit | ✅ | Unsupported customer-volume language removed from rewritten homepage. |
| SEO-10 | Testimonial audit | ✅ | Generic anonymous testimonial section removed from rewritten homepage. |
| SEO-11 | `/about` | ✅ | Entity/trust page implemented. |
| SEO-12 | `/pricing` | ✅ | Dedicated pricing page + real CHF offers in schema. |
| SEO-13 | `/templates` hub | ✅ | Public template hub implemented. |
| SEO-14 | `/templates/business-stamps` | ✅ | Business category implemented. |
| SEO-15 | View Templates CTA | ✅ | Homepage CTA links to `/templates`. |
| SEO-16 | Digital stamp guide | ✅ | `/guides/what-is-a-digital-stamp`. |
| SEO-17 | PDF stamping guide | ✅ | `/guides/how-to-add-a-stamp-to-a-pdf`. |
| SEO-18 | GSC + Bing Webmaster verification | 🟡 | No Search Console/Bing connector or installable plugin is available in this workspace. Requires account-level verification outside repo tooling. |
| SEO-19 | Baseline query benchmark | ✅ | 2026-08-08 live web baseline: Stampelo not yet surfaced for representative non-brand queries; competitors recorded in final benchmark note. |
| SEO-20 | Notary category | ✅ | `/templates/notary-stamps`. |
| SEO-21 | Medical category | ✅ | `/templates/medical-stamps`. |
| SEO-22 | File-format guide | ✅ | `/guides/png-vs-svg-vs-pdf-stamp` covers PNG/SVG/EPS/PDF/DOCX. |
| SEO-23 | Company-stamp guide | ✅ | `/guides/company-stamp-requirements`. |
| SEO-24 | FAQ | ✅ | Dedicated FAQ page + FAQPage schema. |
| SEO-25 | Internal linking graph | ✅ | Homepage, templates, categories, guides and tools interlink. |
| SEO-26 | OG/Twitter preview asset | ✅ | `client/public/og-stampelo.svg` and base social metadata added. |
| SEO-27 | Analytics placeholder cleanup | ✅ | Unresolved `%VITE_ANALYTICS_*%` production placeholders removed from base HTML. |
| SEO-28 | HTML language consistency | ✅ | Default public SEO HTML is English; client locale updates `document.documentElement.lang`. |
| SEO-29 | Additional template categories | ✅ | Status/workflow category added after demand evidence from competitive SERPs. |
| SEO-30 | Qualified individual template pages | ✅ | Approved, Received, Paid and Confidential pages only; no mass 300-page generation. |
| SEO-31 | Genuine third-party entity/review layer | 🟡 | No Trustpilot/directory connector exists. No review or `sameAs` claim is fabricated. Requires owned external-account actions. |
| SEO-32 | Further pillar/guide expansion | ✅ | Digital-vs-rubber, shape comparison and transparent-PNG guides added. |
| SEO-33 | International IA decision | ✅ | Decision: keep public SEO architecture English-only for now; do not publish `/de/` or hreflang until localized search demand/content is validated. Client UI locale remains separate from SEO IA. |
| SEO-34 | AI/search answer benchmark repeat | ⏳ | Run immediately after final production merge/deploy and record dated result. |

## External account boundary

SEO-18 and SEO-31 cannot be completed truthfully through the currently connected tooling. They require ownership/authentication in Google Search Console, Bing Webmaster Tools, Trustpilot and/or third-party directory accounts. The repository implementation intentionally avoids pretending those external actions occurred.

## Template scale rule

Do not convert the 300+ in-app templates into 300+ indexable pages. New individual URLs require demonstrated intent, unique use-case copy, a distinct rendered preview and useful internal links. Current individual pages are limited to strong workflow terms already observed in the competitive search ecosystem.
