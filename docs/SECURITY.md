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

## Download IDOR — P0 LAUNCH BLOCKER

**This is a confirmed Insecure Direct Object Reference (IDOR) / Broken Object Level Authorization vulnerability. It must be fixed before public launch.**

### Attack vector

`orders.id` is a PostgreSQL `serial` primary key — it is sequential and enumerable (1, 2, 3, …). The `order.getByOrderId` tRPC procedure is a `publicProcedure` with no authentication check. It returns the full order object including `downloadUrls`. The Vercel Blob files at those URLs are stored with `access: "public"`.

An attacker does not need to guess any unguessable URL. They can enumerate:
```
GET /api/trpc/order.getByOrderId?input={"orderId":1}
GET /api/trpc/order.getByOrderId?input={"orderId":2}
...
```
and retrieve any customer's download URLs for any order ID. This is a complete authorization bypass.

### Current state

- `server/routers/order.ts` — `getByOrderId` is `publicProcedure`, no ownership check
- `server/storage.ts` — `storagePut()` uses `access: "public"` for all exports
- `orders.id` — sequential integer primary key
- No guest download token exists

### Required remediation (before launch)

1. `getByOrderId` must require authentication. Authenticated users may only access orders where `order.userId === ctx.user.id`.
2. Guest purchases (unauthenticated checkout) need a separate high-entropy `downloadToken` column (e.g., `nanoid(32)`), not the sequential order ID. The guest download page must accept only this token.
3. Download delivery must require either authenticated ownership authorization or possession of a valid high-entropy guest token.
4. Prefer private Blob storage with a server-side authorized download proxy so the underlying file URL cannot bypass authorization even if obtained.

### Required tests (before launch)

- User A cannot access User B's order via `getByOrderId`
- Anonymous caller cannot enumerate order IDs
- Invalid guest token is denied
- Valid guest token only accesses its own order
- Direct unauthorized Blob URL download is denied (requires private storage)

**Do not describe download delivery as "signed", "secure", or "time-limited" in any documentation or marketing material until this remediation is implemented and tested.**

## Historical Issue: Bundle Exposure

During the Manus to Vercel migration, an intermediate deployment configuration caused the raw server bundle to be served as the homepage. This was resolved by switching to the Build Output API with explicit routing rules. The current architecture prevents recurrence.
