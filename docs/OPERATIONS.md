# Operations

## Deployment

Production deploys automatically from the `main` branch via Vercel.

To deploy manually:
```bash
vercel --prod
```

## Database Operations

```bash
# Run migrations
pnpm db:migrate

# Re-seed templates (idempotent)
pnpm db:seed

# Connect to production DB
psql $DATABASE_URL
```

## Rollback

1. In Vercel Dashboard → Deployments → select previous deployment → Promote to Production
2. If DB migration needs rollback: restore from Neon point-in-time recovery

## Stripe Webhook Recovery

If a webhook was missed: Stripe Dashboard → Developers → Webhooks → select endpoint → Resend event.

## Logs

- Application logs: Vercel Dashboard → Functions → Logs
- Database logs: Neon Dashboard → Monitoring
- Stripe events: Stripe Dashboard → Developers → Events
