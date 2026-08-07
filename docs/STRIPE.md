# Stripe Integration

## Plans

| Plan | Price (CHF) | Included Formats |
|---|---|---|
| PROMO | CHF 2.50 | PNG |
| ECONOM | CHF 3.50 | PNG + SVG |
| PREMIUM | CHF 4.50 | PNG + SVG + PDF |
| VIP WORD | CHF 5.50 | PNG + SVG + PDF + DOCX |

## Checkout Flow

1. User selects a plan in the Download modal → `order.createCheckout` tRPC mutation called
2. Server creates a Stripe Checkout Session and an `orders` row with `status = "pending"`
3. User is redirected to the Stripe-hosted checkout page
4. After payment, Stripe redirects to `/download?session_id=...` (UI only — this does **not** mark the order as paid)

## Webhook Flow

1. Stripe sends `checkout.session.completed` to `https://www.stampelo.com/api/stripe/webhook`
2. Webhook handler verifies the Stripe signature using `STRIPE_WEBHOOK_SECRET`
3. **Idempotency check:** if `orders.status === "fulfilled"` for this session, skip
4. Mark order `status = "paid"`
5. Generate export files based on plan
6. Upload files to Vercel Blob
7. Update order with `downloadUrls` and `status = "fulfilled"`
8. Send fulfillment email via Resend

**Critical:** A browser redirect to the success page never marks an order as paid. Only a verified Stripe webhook triggers fulfillment.

## Webhook Endpoint

`https://www.stampelo.com/api/stripe/webhook`

Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint.

## Required Webhook Events

Only one event is currently handled:

| Event | Handler |
|---|---|
| `checkout.session.completed` | Fulfills order, generates exports, sends email |

## Idempotency

The webhook handler checks `orders.stripeSessionId` before processing. If the order is already `fulfilled`, the event is silently skipped. This prevents double-fulfillment on Stripe webhook retries.

## Webhook Secret

Set `STRIPE_WEBHOOK_SECRET` in Vercel environment variables. Obtain from Stripe Dashboard → Webhooks → your endpoint → Signing secret.

## Test Cards

| Card | Behavior |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
