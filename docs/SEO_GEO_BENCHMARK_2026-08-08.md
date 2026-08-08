# Stampelo SEO/GEO Benchmark — 2026-08-08

Canonical strategy: `docs/SEO_GEO.md`
Execution roadmap: `docs/SEO_GEO_IMPLEMENTATION.md`
Production domain: `https://www.stampelo.com`

## Purpose

This is the first dated benchmark after the SEO/GEO technical foundation and public authority architecture were deployed to production. It records what is live, what search engines currently surface, and the competitive answer pattern to compare against future measurements.

## Production verification

Verified on 2026-08-08 after production deployment:

- `https://www.stampelo.com/` returns HTTP 200 with crawlable server/build-time entity content.
- Homepage canonical is `https://www.stampelo.com/`.
- Homepage contains Organization, WebSite and WebApplication JSON-LD.
- Public content routes have unique titles, descriptions, self canonicals and crawlable bodies.
- Qualified template pages such as `/templates/approved-stamp` return their own route-specific body, not the homepage fallback.
- Unknown URLs return HTTP 404 with `noindex,nofollow,noarchive`.
- `/account`, `/admin` and `/download` are excluded from search indexing.
- `robots.txt`, `sitemap.xml` and `llms.txt` are publicly reachable.
- Build verification explicitly rejects duplicate homepage bodies on the qualified expansion pages.

## Search benchmark — immediate post-deploy

Queries checked immediately after the final production deployment:

- `site:stampelo.com`
- `"Stampelo" "digital stamp"`
- `"Stampelo" "online stamp maker"`
- `"Stampelo" "PDF stamp"`
- `best online stamp maker`
- `custom stamp maker online`
- `transparent PNG stamp online`
- `SVG stamp maker`

### Stampelo result

**No Stampelo result was surfaced by the checked web search index immediately after deployment.**

This is the expected launch baseline rather than evidence of a crawl failure: the new crawlable pages and metadata had only just been deployed. Future benchmarks should measure discovery/indexing and ranking movement from this zero-visibility starting point.

## Competitive answer/search pattern observed

The representative non-brand searches surfaced competitors and adjacent tools including:

- `stampmaker.online` — detailed browser-editor description, shapes, SVG icons, templates and export formats.
- `simplestampmaker.com` — strong exact-query framing around free online stamp creation and transparent PNG output.
- `stampforger.com` — explicit Approved/Received/Paid/Confidential use cases and template language.
- `stampmakertool.com` — transparent PNG, SVG and file-format facts.
- `companystampgenerator.com` — company-stamp-specific intent and transparent PNG output.
- Browserling/OnlinePNGTools — highly specific transparent-stamp intent.

The consistent pattern is factual keyword alignment plus explicit tool capabilities and use-case pages. Stampelo's new architecture is intentionally structured around the same extractability signals while preserving a stable canonical entity and avoiding unsupported trust claims.

## SEO-34 result

**SEO-34 — AI/search answer benchmark repeat: COMPLETE for the launch checkpoint.**

Result: zero indexed/search-visible Stampelo presence immediately after deployment. This becomes the dated baseline for the next comparison.

The benchmark should be repeated after search-engine discovery/indexing rather than interpreting the immediate zero result as a ranking outcome.

## External-account boundaries

Two roadmap items cannot be truthfully completed through the currently connected workspace tools:

- **SEO-18 — Google Search Console + Bing Webmaster Tools verification/submission.** No connected or installable Search Console/Bing Webmaster integration was available in this workspace.
- **SEO-31 — genuine third-party entity/review layer.** No Trustpilot or relevant directory-account connector was available. No profile, review, rating or `sameAs` relationship has been fabricated.

These remain account-level operational actions. The repository and production site are prepared for them.

## Next measurement criteria

At the next benchmark record:

1. whether the canonical homepage is indexed;
2. count of indexed intended URLs;
3. branded Stampelo query visibility;
4. first non-brand impressions/positions for tool, guide and template queries;
5. whether Stampelo appears in available AI-answer surfaces for the canonical benchmark set;
6. genuine external citations/reviews only after those profiles actually exist.
