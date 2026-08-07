# Operations

## Deploy Process

Every push to the `main` branch of `github.com/scali790/stampelo` triggers an automatic Vercel production deployment.

## Rollback

In Vercel Dashboard -> Deployments, select any previous successful deployment and click **Promote to Production**.

## Database Migrations

```bash
pnpm db:generate   # Generate SQL from schema.ts changes
pnpm db:migrate    # Apply to Neon database
```

Never edit generated migration SQL files manually.

## Template Seeding

```bash
pnpm tsx scripts/seed-templates.ts
```

The seed script is idempotent (upsert by slug). Safe to re-run.

## Admin Bootstrap

Set `ADMIN_EMAIL=your@email.com` in Vercel environment variables. Sign in with that email at `https://www.stampelo.com/account`. The user is auto-promoted to admin on first sign-in.

## Stripe Webhook Recovery

If a webhook delivery fails, use Stripe Dashboard -> Developers -> Webhooks -> your endpoint -> **Resend** to replay the event. The webhook handler is idempotent.

## Resend Verification

If magic link emails stop delivering, check:
1. Resend Dashboard -> Logs for delivery errors
2. `RESEND_API_KEY` is set in Vercel and scoped to `stampelo.com`
3. `stampelo.com` domain status in Resend Dashboard -> Domains

## Logs

**Vercel runtime logs:** Vercel Dashboard -> Project -> Deployments -> [deployment] -> Functions -> View logs.

**Local dev logs:** `.manus-logs/` directory (devserver.log, browserConsole.log, networkRequests.log).
