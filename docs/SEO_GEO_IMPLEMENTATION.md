# Stampelo SEO + GEO Implementation Roadmap

Status: **canonical execution plan**

This document translates `docs/SEO_GEO.md` into an implementation sequence for the live Stampelo product. `docs/SEO_GEO.md` remains the strategy and evidence document; this file is the operational source of truth for what is implemented, what is next, and in which priority/order work must be shipped.

Last live audit: **2026-08-08**
Canonical production domain: `https://www.stampelo.com`
Repository: `scali790/stampelo`

---

## 1. Governing principles

1. **Technical crawlability before content scale.** No large content/template rollout before route metadata, canonicals, status codes, robots, sitemap and crawlable HTML are correct.
2. **Editor may remain an app; public SEO pages must be crawlable.** Search/GEO landing pages must expose useful HTML without requiring successful client-side JavaScript execution.
3. **One canonical Stampelo entity.** Product naming and factual description must remain consistent across homepage, About, schema, directories and off-page profiles.
4. **No thin template explosion.** 300+ product templates do not mean 300+ indexable pages. Index category hubs first; individual template URLs only after a quality/search-demand threshold is met.
5. **No fabricated trust signals.** Reviews, ratings, customer counts and customer claims must be verifiable before they are published or included in schema.
6. **Fact-dense GEO content.** Informational blocks should answer questions neutrally and precisely, with concrete product facts and definitions that can be extracted and cited by answer engines.
7. **Measure from production.** Search Console, Bing Webmaster Tools and recurring benchmark queries are part of the implementation, not an optional afterthought.

---

## 2. Live baseline audit — 2026-08-08

### Resolved since the original strategy audit

- [x] `https://www.stampelo.com` is reachable and returns HTTP 200.
- [x] The former Cloudflare 525/SSL outage documented in `SEO_GEO.md` is no longer present.
- [x] HTTPS is active.
- [x] `robots.txt` exists.
- [x] `sitemap.xml` exists.
- [x] The canonical production hostname is documented as `www.stampelo.com`.

### Current critical gaps

- [ ] Initial HTML for application pages is a SPA shell and does not expose meaningful page content before JavaScript execution.
- [ ] Route-specific title, description, canonical and Open Graph metadata are missing.
- [ ] `/editor` and other routes inherit the homepage canonical.
- [ ] Unknown public URLs currently fall through to the SPA shell instead of a real HTTP 404 response.
- [ ] Structured data (`Organization`, `WebSite`, `WebApplication`) is not present.
- [ ] Sitemap contains only the current app/legal routes and not the SEO/GEO architecture defined in `SEO_GEO.md`.
- [ ] Robots policy does not yet explicitly cover all private/non-search surfaces such as admin/download flows.
- [ ] Public `/about`, `/templates`, `/pricing`, template category and guide pages do not yet exist.
- [ ] Homepage copy does not yet use the canonical entity definition from `SEO_GEO.md`.
- [ ] Homepage contains generic/unverified testimonial/trust claims that require a separate trust audit before being used as SEO/GEO evidence.
- [ ] There is no implemented internal-link graph between guides, template categories and product tools.
- [ ] Current language switch is client-side; there is no deliberate international URL/hreflang architecture yet.

---

## 3. Delivery sequence

### PR 1 — SEO/GEO Foundation — P0

Goal: make the existing public application technically safe for indexing before adding new content surfaces.

Required scope:

- [ ] Add route-aware metadata for every existing public route.
- [ ] Ensure every indexable route has a self-referencing canonical URL.
- [ ] Mark private/transactional routes `noindex` where appropriate.
- [ ] Add crawlable server/build-time HTML for core public routes rather than an empty SPA shell only.
- [ ] Add valid JSON-LD foundation: Homepage `Organization` + `WebSite` + `WebApplication`; Editor `WebApplication`; PDF editor `WebApplication`.
- [ ] Return an actual HTTP 404 for unknown public URLs.
- [ ] Harden `robots.txt` for private/non-indexable routes.
- [ ] Validate `sitemap.xml` to contain only intentionally indexable current routes.
- [ ] Keep canonical host fixed to `https://www.stampelo.com`.
- [ ] Add automated build checks for metadata, canonical, robots/sitemap and crawlable output.
- [ ] Update documentation with the verified live state and remaining work.

Acceptance criteria:

- Known public pages return 200 and unique metadata.
- Unknown page returns HTTP 404.
- `/editor` does not canonicalize to `/`.
- `/account`, `/admin` and transactional download surfaces are not indexable.
- Homepage response contains meaningful crawlable product/entity text and structured data without depending solely on client-side rendering.
- Build and existing tests remain green.

### PR 2 — Homepage GEO + Trust Cleanup — P0

- [ ] Publish the canonical Stampelo entity definition in visible homepage content.
- [ ] Add concise GEO answer blocks: What is Stampelo? formats, shapes, PDF stamping, account requirement.
- [ ] Add a concrete 3–5 step “How it works” section.
- [ ] Separate factual explanation from sales CTA copy.
- [ ] Audit every trust/customer-volume claim.
- [ ] Remove generic/unverifiable testimonials or replace only with genuine attributable evidence.
- [ ] Change “View Templates” CTA to `/templates` once that hub exists.
- [ ] Verify all product facts against production before publication.

### PR 3 — Core SEO Pages — P0

Create:

- [ ] `/about`
- [ ] `/pricing`
- [ ] `/templates`
- [ ] `/templates/business-stamps`

Each page requires unique title/H1/meta, self canonical, crawlable HTML, appropriate schema, factual CTA, internal links and sitemap entry.

### PR 4 — P0 Guides + Internal Linking — P0

Create:

- [ ] `/guides/what-is-a-digital-stamp`
- [ ] `/guides/how-to-add-a-stamp-to-a-pdf`

Then implement the first internal-link graph:

`homepage -> guides/templates -> category/tool -> related guide`

### PR 5 — Webmaster Verification + Baseline — P0 operational

- [ ] Verify Google Search Console.
- [ ] Submit production sitemap.
- [ ] Verify Bing Webmaster Tools.
- [ ] Observe/request indexing of core URLs.
- [ ] Record indexed-page baseline.
- [ ] Run the canonical query benchmark from `SEO_GEO.md` against Google/Bing and available AI-answer surfaces.
- [ ] Store the dated baseline in repo documentation.

---

## 4. P1 — first expansion after technical P0 is proven

- [ ] `/templates/notary-stamps`
- [ ] `/templates/medical-stamps`
- [ ] `/guides/png-vs-svg-vs-pdf-stamp`
- [ ] `/guides/company-stamp-requirements`
- [ ] `/faq`
- [ ] Complete internal-link graph across P0/P1 pages.
- [ ] Add Breadcrumb structured data to content/category pages.
- [ ] Add `Offer`/pricing structured data only from real live prices.
- [ ] Add OG/social images for key landing pages.
- [ ] Verify production analytics injection; no unresolved build placeholders in delivered HTML.
- [ ] Make HTML language metadata match actual rendered language.

---

## 5. P2 — authority and controlled template scale

- [ ] Expand supporting guides around the seven authority pillars in `SEO_GEO.md`.
- [ ] Add additional template category hubs based on real query demand/use cases.
- [ ] Qualify individual template pages only where named demand exists, unique copy and preview exist, metadata is materially distinct, the page is not a colour/font variant, and useful category/guide/editor links exist.
- [ ] Begin independent entity corroboration through genuine review platforms, verified directories, product walkthrough/video, consistent social profiles and legitimate industry/document-workflow mentions.

---

## 6. P3 — international and industry expansion

- [ ] Validate non-English organic demand first.
- [ ] Decide international architecture (`/de/`, other locales) deliberately.
- [ ] Add hreflang and language-specific metadata only after dedicated localized pages exist.
- [ ] Expand industry-specific authority pages where demand is validated.
- [ ] Continue earned third-party mentions/citations.

---

## 7. P4 — optimisation from evidence

- [ ] Re-run AI-answer benchmark periodically.
- [ ] Expand content based on Search Console query data.
- [ ] Promote template pages from in-app/noindex state only when the quality threshold is met.
- [ ] Consolidate/canonicalize pages that fail to demonstrate unique search value.
- [ ] Review structured data whenever product capabilities/prices change.

---

## 8. Canonical page map

| URL | Type | Priority | Status |
|---|---|---|---|
| `/` | Homepage/product | P0 | live; GEO rewrite PR2 |
| `/editor` | Tool | P0 | live; technical hardening PR1 |
| `/pdf-editor` | Tool | P0 | live; technical hardening PR1 |
| `/about` | Entity/trust | P0 | planned PR3 |
| `/pricing` | Commercial | P0 | planned PR3 |
| `/templates` | Hub | P0 | planned PR3 |
| `/templates/business-stamps` | Category | P0 | planned PR3 |
| `/guides/what-is-a-digital-stamp` | Guide/pillar | P0 | planned PR4 |
| `/guides/how-to-add-a-stamp-to-a-pdf` | Guide | P0 | planned PR4 |
| `/templates/notary-stamps` | Category | P1 | planned |
| `/templates/medical-stamps` | Category | P1 | planned |
| `/guides/png-vs-svg-vs-pdf-stamp` | Guide | P1 | planned |
| `/guides/company-stamp-requirements` | Guide | P1 | planned |
| `/faq` | Support/GEO | P1 | planned |

Private/transactional pages such as `/account`, `/admin` and download flows must not become SEO landing pages.

---

## 9. Canonical entity definition

> Stampelo is an online digital stamp and seal creator. It provides a browser-based editor with 300+ customizable templates, multiple stamp shapes, custom icon/SVG uploads, and export in PNG, SVG, EPS, PDF, and DOCX with transparent backgrounds — plus a built-in tool to apply stamps directly to PDF documents. It is used by businesses, freelancers, notaries, and administrators who need a digital or print-ready company stamp without design software.

Metadata may shorten this, but product facts and meaning must remain stable and verified.

---

## 10. Technical SEO contract

Every intentionally indexable public URL must have: HTTP 200 only when it exists; meaningful HTML without requiring client JS; one descriptive H1; unique title and meta description; self canonical on `https://www.stampelo.com`; correct robots policy; correct OG metadata; correct language; sitemap inclusion; and only appropriate factual structured data.

Unknown URLs must return HTTP 404. Private/noindex URLs must not appear in the sitemap.

---

## 11. GEO content contract

Informational/GEO blocks must answer directly, prefer precise facts over adjectives, separate factual explanation from CTA, define terms, state limitations, avoid unsupported legal conclusions and fake social proof, link to the most relevant next resource, and remain understandable when extracted from surrounding marketing copy.

---

## 12. Template indexing contract

Default: templates live inside the product, not as hundreds of indexable thin pages. Index category pages first. Individual template pages require evidence of search/use-case demand plus genuinely unique value.

---

## 13. Measurement contract

Track SEO indexed pages, impressions/clicks/average position, branded vs non-brand queries, tool/category/guide entrances, crawl/index errors and referring domains. Track GEO proxies via benchmark-query appearance, entity-description consistency, genuine third-party citations and identifiable AI/referral traffic signals.

---

## 14. Overall definition of done

The initial program milestone is complete only when P0 routes are crawlable with correct status/canonical/metadata; homepage/About expose one consistent entity; core template/guide hubs are live; schema contains only real facts; Google/Bing discover intended P0 URLs; a dated search/GEO benchmark exists; and future expansion is governed by evidence and the quality thresholds above.

Every future SEO/GEO PR must update this roadmap when it completes or materially changes a listed work item.
