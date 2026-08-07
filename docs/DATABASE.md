# Database

## Provider

**Neon PostgreSQL** (serverless, `pg` driver). ORM: **Drizzle**.

Connection string: `DATABASE_URL` environment variable.

## Schema Tables

| Table | Purpose |
|---|---|
| `users` | User accounts — `id`, `email`, `name`, `role` (`user`/`admin`), `emailVerified` |
| `accounts` | OAuth provider accounts (Auth.js) |
| `sessions` | Active sessions (Auth.js database sessions) |
| `verificationTokens` | Magic link tokens (Auth.js) |
| `designs` | Saved stamp designs — `stateJson` (full editor state), `shareToken`, `userId` |
| `orders` | Purchase orders — `stripeSessionId`, `plan`, `status`, `downloadUrls`, `designId` |
| `templates` | Template library — `name`, `category`, `shape`, `stateJson`, `thumbnailSvg`, `isActive`, `sortOrder` |
| `icons` | Custom icon storage (currently unused; built-in icons served from `shared/iconData.ts`) |

## Migrations

```bash
pnpm db:generate   # Generate SQL from schema changes
pnpm db:migrate    # Apply pending migrations
```

Migration files live in `drizzle/`. Never edit generated SQL files manually.

## Template Seeding

Templates are seeded via `scripts/seed-templates.ts`. The seed script is idempotent (upsert by slug).

**Current active template count: 318** (verified against production database, 2026-08-07).

## User Role Storage

The `users.role` column stores `"user"` or `"admin"`. Role is set server-side only — never from client input.

## Idempotency

Order idempotency is enforced via `orders.stripeSessionId` — the webhook handler checks for an existing fulfilled order before processing.

## SSL

Neon requires SSL. The connection string should include `?sslmode=require`.
