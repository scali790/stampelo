# Domain and DNS

## Canonical Domain

`https://www.stampelo.com` — all production traffic, Auth.js callbacks, Stripe webhooks, and Resend sender domain use this canonical URL.

## Apex Redirect

`https://stampelo.com` permanently redirects (308) to `https://www.stampelo.com`. This is configured in Vercel's domain settings.

## DNS Provider

Cloudflare manages DNS for `stampelo.com`.

## DNS Records

Exact DNS targets must be read from the live Vercel domain configuration panel (Vercel Dashboard -> Project -> Settings -> Domains). Do not hard-code generic values as Vercel may update them.

Typical Vercel DNS configuration for Cloudflare:
- `www` CNAME -> Vercel-provided CNAME target (DNS Only, not proxied, during initial verification)
- `@` A record -> Vercel-provided IP (for apex redirect)

## SSL

Vercel provisions and auto-renews SSL certificates for both `www.stampelo.com` and `stampelo.com` via Let's Encrypt.

## Auth URLs

All Auth.js callback URLs use `https://www.stampelo.com` as the base. The `AUTH_URL` environment variable must be set to `https://www.stampelo.com` in Vercel.

## Stripe Webhook

Webhook endpoint: `https://www.stampelo.com/api/stripe/webhook`

## Resend Domain

The `stampelo.com` domain is verified in Resend. The API key must be scoped to this domain.
