# Authentication

## Provider: Auth.js v5

Stampelo uses [Auth.js](https://authjs.dev) v5 with database sessions stored in PostgreSQL.

## Supported Login Methods

1. **Email Magic Link** (via Resend) — passwordless, no account creation required
2. **Google OAuth** — one-click sign-in with Google account

## Admin Bootstrap

Set the `ADMIN_EMAIL` environment variable to your email address.
On first sign-in with that email, the user is automatically promoted to `admin` role.

No manual database editing is required for the initial admin setup.

## Session Strategy

Sessions are stored in the `sessions` table in PostgreSQL (not JWTs).
This allows server-side session revocation.

## Manus OAuth Removal

The original Manus OAuth (`/api/oauth/callback`, `VITE_APP_ID`, `OAUTH_SERVER_URL`) has been
completely removed and replaced by Auth.js. No Manus OAuth dependency remains.
