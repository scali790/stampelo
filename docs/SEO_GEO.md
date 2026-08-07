# SEO and Geo

## Current State

Stampelo is live at `https://www.stampelo.com` with basic SEO infrastructure in place.

## Canonical Domain

`https://www.stampelo.com`. The apex domain (`stampelo.com`) permanently redirects to `www`.

## Metadata

- `<title>` and `<meta name="description">` set in `client/index.html`
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`) set for social sharing
- `<link rel="canonical">` pointing to `https://www.stampelo.com`

## Sitemap and Robots

- `sitemap.xml` served from `client/public/sitemap.xml`
- `robots.txt` served from `client/public/robots.txt`

## Internationalization

English and German locale strings are implemented in `client/src/i18n/en.ts` and `client/src/i18n/de.ts`.

## Template Positioning

The "300+ editable templates" claim is valid while the active template count remains >= 300. Current count: 318.

## Future Work

Competitor reverse-engineering, full GEO/SEO strategy, use-case landing pages (medical, legal, wedding, notary), and structured data markup are separate future workstreams tracked in `docs/OPEN_ITEMS.md`.
