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

Branch: `agent/seo-geo-foundation`

Goal: make the existing public application technically safe for indexing before adding new content surfaces.

Required scope:

- [ ] Add route-aware metadata for every existing public route.
- [ ] Ensure every indexable route has a self-referencing canonical URL.
- [ ] Mark private/transactional routes `noindex` where appropriate.
- [ ] Add crawlable server/build-time HTML for core public routes rather than an empty SPA shell only.
- [ ] Add valid JSON-LD foundation:
  - [ ] Homepage: `Organization` + `WebSite` + `WebApplication`.
  - [ ] Editor: `WebApplication` / `DesignApplication`.
  - [ ] PDF editor: `WebApplication` / document utility facts only.
- [ ] Return an actual HTTP 404 for unknown public URLs.
- [ ] Harden `robots.txt` for private/non-indexable routes.
- [ ] Regenerate/validate `sitemap.xml` to contain only intentionally indexable current routes.
- [ ] Keep canonical host fixed to `https://www.stampelo.com`.
- [ ] Add automated tests/build checks for metadata, canonical, robots/sitemap and 404 routing where practical.
- [ ] Update documentation with the verified live state and remaining work.

Acceptance criteria:

- Known public pages return 200 and unique metadata.
- Unknown page returns HTTP 404.
- `/editor` does not canonicalize to `/`.
- `/account`, `/admin` and transactional download surfaces are not indexable.
- Homepage response contains meaningful crawlable product/entity text and structured data without depending solely on client-side rendering.
- Build and existing tests remain green.

### PR 2 — Homepage GEO + Trust Cleanup — P0

Goal: make `/` the canonical entity/product landing page described in `SEO_GEO.md`.

Scope:

- [ ] Publish the canonical Stampelo entity definition.
- [ ] Add concise GEO answer blocks:
  - [ ] What is Stampelo?
  - [ ] What file formats does Stampelo export?
  - [ ] What stamp shapes are supported?
  - [ ] Can Stampelo place a stamp on a PDF?
  - [ ] Is an account required?
- [ ] Add a concrete 3–5 step “How it works” section.
- [ ] Preserve commercial CTA copy separately from neutral answer copy.
- [ ] Audit every trust/customer-volume claim and remove or qualify unverifiable claims.
- [ ] Remove generic/fabricated-looking testimonials or replace them only with genuine, attributable customer evidence.
- [ ] Change “View Templates” CTA to the future `/templates` hub.
- [ ] Verify all product facts against the live editor/export pipeline before publication.

### PR 3 — Core SEO Pages — P0

Goal: establish the minimum public information architecture.

Create:

- [ ] `/about`
- [ ] `/pricing`
- [ ] `/templates`
- [ ] `/templates/business-stamps`

Requirements for each page:

- unique title/H1/meta description
- self canonical
- server/build-time crawlable body content
- appropriate schema only
- factual CTA into the relevant product flow
- breadcrumb/internal linking where applicable
- sitemap entry

### PR 4 — P0 Guides + Internal Linking — P0

Create:

- [ ] `/guides/what-is-a-digital-stamp`
- [ ] `/guides/how-to-add-a-stamp-to-a-pdf`

Then implement the first internal-link graph:

`homepage -> guides/templates -> category/tool -> related guide`

Guide content must be neutral, factual and written for extraction/citation as well as human usefulness.

### PR 5 — Webmaster Verification + Baseline — P0 operational

After P0 pages are deployed:

- [ ] Verify Google Search Console property.
- [ ] Submit production sitemap.
- [ ] Verify Bing Webmaster Tools.
- [ ] Request/observe indexing of the core URLs.
- [ ] Record indexed-page baseline.
- [ ] Run the canonical query benchmark from `SEO_GEO.md` against Google/Bing and available AI-answer surfaces.
- [ ] Store the dated baseline in repo documentation.

---

## 4. P1 — first expansion after technical P0 is proven

Only start after the P0 URLs are crawlable and production metadata/status tests pass.

- [ ] `/templates/notary-stamps`
- [ ] `/templates/medical-stamps`
- [ ] `/guides/png-vs-svg-vs-pdf-stamp`
- [ ] `/guides/company-stamp-requirements`
- [ ] `/faq`
- [ ] Complete internal-link graph across P0/P1 pages.
- [ ] Add Breadcrumb structured data to content/category pages.
- [ ] Add `Offer`/pricing structured data only from real live prices.
- [ ] Add OG/social images for key landing pages.
- [ ] Fix/verify production analytics injection; no unresolved build placeholders may remain in delivered HTML.
- [ ] Make HTML language metadata match the actual rendered language.

---

## 5. P2 — authority and controlled template scale

- [ ] Expand supporting guides around the seven authority pillars in `SEO_GEO.md`.
- [ ] Add additional template category hubs based on real query demand/use cases.
- [ ] Qualify individual template pages against all of these gates:
  1. named search/use-case demand exists;
  2. page can contain genuinely unique copy;
  3. a real rendered template preview exists;
  4. use case/shape/size metadata is materially distinct;
  5. page is not merely a colour/font variation;
  6. page has useful links to category, guide and editor.
- [ ] Begin independent entity corroboration:
  - genuine review platform presence;
  - verified software/tool directories;
  - product walkthrough/video;
  - consistent social profiles and `sameAs` links;
  - legitimate industry/document-workflow mentions.

---

## 6. P3 — international and industry expansion

Do not implement language folders simply because the editor has a language toggle.

- [ ] Validate non-English organic demand first.
- [ ] Decide international architecture (`/de/`, other locales) deliberately.
- [ ] Add proper hreflang and language-specific metadata only after dedicated localized pages exist.
- [ ] Expand industry-specific authority pages where demand is validated.
- [ ] Continue earned third-party mentions/citations.

---

## 7. P4 — optimisation from evidence

- [ ] Re-run AI-answer benchmark set periodically.
- [ ] Expand content based on Search Console query data, not assumed keyword lists alone.
- [ ] Promote template pages from noindex/in-app state only when the quality threshold is met.
- [ ] Consolidate/canonicalize pages that fail to demonstrate unique search value.
- [ ] Review structured data whenever product capabilities/prices change.

---

## 8. Canonical page map

| URL | Type | Primary role | Priority | Status |
|---|---|---|---|---|
| `/` | Homepage/product | online stamp maker + entity | P0 | live; GEO rewrite pending |
| `/editor` | Tool | create stamp online | P0 | live; technical SEO hardening in PR1 |
| `/pdf-editor` | Tool | stamp a PDF online | P0 | live; technical SEO hardening in PR1 |
| `/about` | Entity/trust | what is Stampelo | P0 | planned PR3 |
| `/pricing` | Commercial | pricing/formats | P0 | planned PR3 |
| `/templates` | Hub | stamp templates | P0 | planned PR3 |
| `/templates/business-stamps` | Category | business stamp templates | P0 | planned PR3 |
| `/guides/what-is-a-digital-stamp` | Guide/pillar | digital stamp definition | P0 | planned PR4 |
| `/guides/how-to-add-a-stamp-to-a-pdf` | Guide | PDF stamping procedure | P0 | planned PR4 |
| `/templates/notary-stamps` | Category | notary templates | P1 | planned |
| `/templates/medical-stamps` | Category | medical templates | P1 | planned |
| `/guides/png-vs-svg-vs-pdf-stamp` | Guide | file formats | P1 | planned |
| `/guides/company-stamp-requirements` | Guide | company stamp information | P1 | planned |
| `/faq` | Support/GEO | answer surface | P1 | planned |

Private/transactional pages such as `/account`, `/admin` and download flows must not become SEO landing pages.

---

## 9. Canonical entity definition

Use the strategy definition from `docs/SEO_GEO.md` as the controlled source. Before publishing a feature claim, verify it against production.

> Stampelo is an online digital stamp and seal creator. It provides a browser-based editor with 300+ customizable templates, multiple stamp shapes, custom icon/SVG uploads, and export in PNG, SVG, EPS, PDF, and DOCX with transparent backgrounds — plus a built-in tool to apply stamps directly to PDF documents. It is used by businesses, freelancers, notaries, and administrators who need a digital or print-ready company stamp without design software.

This text may be shortened for metadata, but the meaning and product facts must remain stable.

---

## 10. Technical SEO contract

Every intentionally indexable public URL must satisfy:

- HTTP 200 only when the resource exists.
- meaningful HTML body available without requiring client JS.
- one descriptive H1.
- unique `<title>`.
- unique meta description.
- self-referencing canonical using `https://www.stampelo.com`.
- correct index/follow policy.
- valid Open Graph URL/title/description.
- correct language metadata.
- inclusion in sitemap if canonical/indexable.
- no inclusion in sitemap if private/noindex.
- appropriate structured data based on actual page content.

Unknown URLs must return HTTP 404.

---

## 11. GEO content contract

Informational/GEO blocks must:

- answer the heading/question immediately;
- prefer precise nouns/numbers/formats over adjectives;
- separate factual explanation from sales CTA;
- define terms explicitly;
- state limitations where relevant;
- avoid unsupported legal conclusions;
- avoid fake social proof;
- be internally linked to one most relevant next resource/tool;
- be understandable when extracted from the page without surrounding marketing copy.

---

## 12. Template indexing contract

Default state: **templates live inside the product, not as indexable thin pages**.

Index category pages first. Individual template pages require evidence and unique value. Do not auto-generate hundreds of URLs from the template database/seed solely because template records exist.

---

## 13. Measurement contract

Track at minimum:

SEO:
- indexed canonical pages;
- impressions/clicks/average position;
- branded vs non-brand queries;
- entrances to tools/category pages/guides;
- crawl/indexing errors;
- referring domains.

GEO proxy metrics:
- benchmark-query appearance in AI answers;
- consistency of the Stampelo entity description across owned/third-party sources;
- genuine third-party citations/mentions;
- AI/referral traffic signals where available.

Record material benchmark snapshots with dates so changes can be compared over time.

---

## 14. Definition of done for the overall program

The SEO/GEO program is not “done” when pages merely exist. The initial implementation milestone is complete when:

1. P0 routes are technically crawlable with correct status/canonical/metadata.
2. Homepage/About expose one consistent Stampelo entity.
3. Core template and guide hubs are live with unique useful content.
4. Structured data validates and contains only real facts.
5. Google and Bing discover/index the intended P0 URLs.
6. A dated search/GEO benchmark exists.
7. Future template/content expansion is governed by Search Console/query evidence and the quality thresholds above.

Any future SEO/GEO PR should update this roadmap's status when it completes or changes a listed work item.
