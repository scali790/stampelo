# Stripe Integration

## Plans (CHF)

| Plan | Price | Formats |
|---|---|---|
| PROMO | CHF 2.50 | PNG |
| ECONOM | CHF 3.50 | PNG + SVG |
| PREMIUM | CHF 4.50 | PNG + SVG + PDF |
| VIP | CHF 5.50 | PNG + SVG + PDF + DOCX |

All plans include: Transparent background, High resolution (600 DPI PNG), Free Shabby effect version.

## Webhook Flow

1. User selects plan → `order.createCheckout` creates Stripe Checkout Session
2. User completes payment on Stripe-hosted page
3. Stripe sends `checkout.session.completed` webhook to `/api/stripe/webhook`
4. Webhook verifies signature, generates exports, stores in Vercel Blob, sends email
5. User receives download link by email and can access via `/download?session_id=...`

## Webhook Endpoint

Production: `https://www.stampelo.com/api/stripe/webhook`

Configure in Stripe Dashboard → Developers → Webhooks.

## Testing

Use card `4242 4242 4242 4242` with any future expiry and any CVC.
