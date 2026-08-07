# Security

## Authentication

Auth.js with database sessions. Sessions are stored server-side in PostgreSQL and can be revoked. Magic link tokens are single-use and expire after a short window.

## Admin Authorization

Admin role is stored in `users.role` and verified server-side on every admin procedure call. The role is never derived from client-supplied data or session tokens alone.

## Stripe Webhook Verification

Every incoming webhook request is verified using `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`. Requests with invalid signatures are rejected with HTTP 400 before any processing.

## SVG Sanitization

Custom SVG uploads are sanitized server-side. Sanitization removes `<script>` tags, event handlers (`on*` attributes), and external resource references. Maximum upload size: 50 KB.

## Environment Variable Security

All secrets are stored in Vercel environment variables and never committed to the repository. `.env.local` is gitignored.

## Source Code Exposure Prevention

The Vercel Build Output API architecture ensures:
- The server bundle (`index.mjs`) is deployed as a Vercel Function, not a static file
- No TypeScript source files, source maps, or backend source code are publicly accessible
- `scripts/verify-bundle.sh` prevents internal project imports from remaining in the bundle

## Historical Issue: Bundle Exposure

During the Manus to Vercel migration, an intermediate deployment configuration caused the raw server bundle to be served as the homepage. This was resolved by switching to the Build Output API with explicit routing rules. The current architecture prevents recurrence.
