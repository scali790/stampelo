# Environment Variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local`.

## APPLICATION

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `NODE_ENV` | Yes | All | Runtime mode | Public | `production` |
| `AUTH_URL` | Yes | Production | Auth.js base URL | Public | `https://www.stampelo.com` |
| `APP_BASE_URL` | No | All | Base URL for email links | Public | `https://www.stampelo.com` |

## DATABASE

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `DATABASE_URL` | Yes | All | Neon PostgreSQL connection string | **Secret** | `postgresql://user:pass@host/db?sslmode=require` |

## AUTH

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `AUTH_SECRET` | Yes | All | Auth.js session signing key | **Secret** | 32+ random bytes (base64) |
| `GOOGLE_CLIENT_ID` | No | All | Google OAuth client ID | Public | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | No | All | Google OAuth client secret | **Secret** | `GOCSPX-...` |

## ADMIN

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `ADMIN_EMAIL` | Yes | All | Email auto-promoted to admin on sign-in | **Secret** | `admin@example.com` |

## STRIPE

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | All | Stripe server-side key | **Secret** | `sk_live_...` or `sk_test_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | All | Stripe frontend key | Public | `pk_live_...` or `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Production | Webhook signature verification | **Secret** | `whsec_...` |

## RESEND

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `RESEND_API_KEY` | Yes | All | Resend API key (Sending access only) | **Secret** | `re_...` |
| `EMAIL_FROM` | No | All | Sender address | Public | `noreply@stampelo.com` |

## STORAGE

| Variable | Required | Env | Purpose | Public/Secret | Example |
|---|---|---|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Yes | Production | Vercel Blob access token (auto-injected) | **Secret** | `vercel_blob_rw_...` |
| `BLOB_BASE_URL` | No | Production | Vercel Blob store base URL | Public | `https://xxx.public.blob.vercel-storage.com` |

## ANALYTICS

No analytics env vars are currently active in production. The Umami analytics script was removed from `client/index.html`.

## Stale / Removed Variables

The following variables were used during Manus-hosted development and are **no longer required**:

`VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, `OWNER_NAME`, `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`, `JWT_SECRET` (replaced by `AUTH_SECRET`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (renamed to `VITE_STRIPE_PUBLISHABLE_KEY`).

## Generating AUTH_SECRET

```bash
openssl rand -base64 32
```
