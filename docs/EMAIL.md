# Email (Resend)

## Provider

Stampelo uses **Resend** for all transactional email. The verified sending domain is `stampelo.com`.

## Sender Address

`noreply@stampelo.com` (configured via `EMAIL_FROM` env var).

## Email Types

| Email | Trigger | Content |
|---|---|---|
| Magic link | User requests sign-in via email | One-time sign-in link |
| Fulfillment | Stripe `checkout.session.completed` webhook | Download link for purchased stamp |

## Required Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Yes | Resend API key — **Sending access only**, scoped to `stampelo.com` |
| `EMAIL_FROM` | No | Sender address (default: `noreply@stampelo.com`) |

## Domain Verification

The `stampelo.com` domain must be verified in the Resend dashboard. The API key must be created with the domain restriction set to `stampelo.com`. A key scoped to a different domain (e.g., `stampelo.ch`) will return a 403 error.

## Least Privilege

The Resend API key should use **Sending access only** — not full access.
