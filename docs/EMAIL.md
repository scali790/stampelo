# Email

## Provider: Resend

Stampelo uses [Resend](https://resend.com) for all transactional email.

## Sender Domain

`stampelo.com` must be verified in Resend.

After adding `stampelo.com` in Resend Dashboard → Domains, Resend will show you the exact DNS records.

**Get the exact values from Resend Dashboard → Domains → stampelo.com → DNS Records.**

## Email Flows

1. **Magic link sign-in** — Auth.js sends via Resend automatically
2. **Order fulfillment** — Download links sent after Stripe webhook confirmation
