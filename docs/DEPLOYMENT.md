# Deployment

## Production Deployment

Stampelo is deployed on Vercel, connected to the `main` branch of the GitHub repository.
Every push to `main` triggers an automatic production deployment.

## Vercel Project Setup

1. Go to https://vercel.com/new
2. Import `github.com/scali790/stampelo`
3. Framework: **Other** (Express + Vite)
4. Build command: `pnpm build`
5. Output directory: `dist`
6. Install command: `pnpm install`
7. Add all environment variables from `.env.example`
8. Enable Vercel Blob storage
9. Deploy

## Domain Configuration

In Vercel Dashboard → Project → Settings → Domains:
- Add `www.stampelo.com` (primary)
- Add `stampelo.com` (redirects to www)

### DNS Records (set at your registrar)

| Type | Host | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `cname.vercel-dns.com` | 300 |
| A | `@` | `76.76.21.21` | 300 |

After adding, Vercel automatically provisions SSL via Let's Encrypt.

## Preview Deployments

Every pull request gets a unique preview URL from Vercel automatically.

## CI/CD Pipeline

GitHub Actions runs on every push and pull request:
- `pnpm install`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

