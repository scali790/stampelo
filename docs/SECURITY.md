# Security

## Authentication

- Auth.js v5 with database sessions (revocable)
- CSRF protection built into Auth.js
- Secure session cookies (httpOnly, sameSite=lax, secure in production)

## Stripe Webhooks

- All webhooks verified with `stripe.webhooks.constructEvent()` before processing
- No test bypass in production code (previously removed)
- Idempotent fulfillment (checks `order.status` before processing)

## Admin Authorization

- Admin role stored in PostgreSQL `users.role` column
- `ADMIN_EMAIL` env var auto-promotes on first sign-in
- All admin procedures check `ctx.user.role === "admin"` server-side
- No client-side role claims accepted

## SVG Upload Sanitisation

- Custom SVG uploads limited to 50 KB
- Client-side sanitisation removes `<script>`, event handlers, and external references

## Download URLs

- Export files stored in Vercel Blob with public URLs
- URLs sent by email and stored in `orders.downloadUrls`
