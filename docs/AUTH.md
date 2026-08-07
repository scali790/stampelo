# Authentication

## Overview

Stampelo uses **Auth.js** (`@auth/express` v0.12) with two providers: Resend magic link (passwordless email) and Google OAuth. Sessions are stored in PostgreSQL.

## Providers

| Provider | Type | Env vars required |
|---|---|---|
| Resend | Email magic link | `RESEND_API_KEY`, `EMAIL_FROM` |
| Google | OAuth 2.0 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

## Canonical Auth URLs

| Endpoint | URL |
|---|---|
| Sign-in page | `https://www.stampelo.com/api/auth/signin` |
| Google callback | `https://www.stampelo.com/api/auth/callback/google` |
| Resend callback | `https://www.stampelo.com/api/auth/callback/resend` |
| Sign-out | `https://www.stampelo.com/api/auth/signout` |

## Critical: Trust Proxy

```ts
app.set("trust proxy", true);
```

This line **must** be present in `src/server-entry.ts`. Vercel terminates HTTPS before forwarding requests to Express. Without `trust proxy`, `req.protocol` returns `http`, causing Auth.js to generate `http://` callback URLs, which Google OAuth and Resend reject.

## Auth Origin

`AUTH_URL=https://www.stampelo.com` must be set in Vercel environment variables.

## Session Storage

Sessions are stored in the `sessions` PostgreSQL table via `DrizzleAdapter`. This enables server-side session revocation.

## Google OAuth Setup

1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `https://www.stampelo.com/api/auth/callback/google`
4. Copy Client ID and Client Secret → set as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel

## Required Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | Yes | Signs session tokens (32+ random bytes) |
| `AUTH_URL` | Yes | `https://www.stampelo.com` |
| `RESEND_API_KEY` | Yes | Sends magic link emails |
| `EMAIL_FROM` | No | Sender address (default: `noreply@stampelo.com`) |
| `GOOGLE_CLIENT_ID` | No | Enables Google login |
| `GOOGLE_CLIENT_SECRET` | No | Enables Google login |
