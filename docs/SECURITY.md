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

## Download URL Security Gap (KNOWN ISSUE)

**Current state: export download URLs are publicly accessible without authentication.**

All generated export files (PNG, SVG, PDF, DOCX) are stored in Vercel Blob with `access: "public"`. The `storagePut()` helper in `server/storage.ts` passes `access: "public"` to the Vercel Blob API. There is no signed URL, no expiry, and no token required to download a file.

Additionally, the `order.getByOrderId` tRPC procedure is a `publicProcedure` — it does not require authentication. Any party with the order ID can retrieve the order's download URLs.

**Practical risk:** A user who obtains another user's Vercel Blob URL or order ID can download their purchased stamp files without authentication. The URLs are unguessable (random suffix) but permanent.

**Remediation required:** See `docs/OPEN_ITEMS.md` — this is classified as P1. The remediation path is to either (a) switch Vercel Blob objects to private access and generate short-lived signed URLs per download request, or (b) proxy downloads through an authenticated server endpoint that verifies session ownership before streaming the file.

Do not describe download delivery as "signed" or "time-limited" in any customer-facing or internal documentation until this remediation is implemented.

## Historical Issue: Bundle Exposure

During the Manus to Vercel migration, an intermediate deployment configuration caused the raw server bundle to be served as the homepage. This was resolved by switching to the Build Output API with explicit routing rules. The current architecture prevents recurrence.
