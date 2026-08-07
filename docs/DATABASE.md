# Database

## Provider: Neon PostgreSQL

Stampelo uses [Neon](https://neon.tech) serverless PostgreSQL.

## Schema

Tables: `users`, `accounts`, `sessions`, `verificationTokens` (Auth.js), `designs`, `orders`, `templates`, `icons`

## Migrations

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm db:migrate
```

Migrations are stored in `drizzle/migrations/` and committed to Git.

## Seeding

```bash
pnpm db:seed
```

Seeds 318+ templates across 14 categories and 4 shapes. Idempotent (safe to re-run).

## Backup Strategy

- Neon provides automatic daily backups with point-in-time recovery
- For manual backup: `pg_dump $DATABASE_URL > backup.sql`
- Templates can be re-seeded from `server/seed300Templates.ts` at any time
