# Admin Authorization

## Bootstrap Mechanism

The admin account is bootstrapped via the `ADMIN_EMAIL` environment variable. No manual SQL is required.

**Behavior:** When a user successfully signs in and their email matches the value of `ADMIN_EMAIL`, the server automatically updates their `role` field in the `users` table to `admin`. This check runs on every sign-in.

## Authorization Model

Admin authorization is enforced server-side via `adminProcedure` in `server/_core/trpc.ts`. The `role` field is read from the database on every request — it is never derived from the session token alone.

| Procedure type | Auth required | Admin required |
|---|---|---|
| `publicProcedure` | No | No |
| `protectedProcedure` | Yes | No |
| `adminProcedure` | Yes | Yes (`role = "admin"`) |

## Admin Panel

The admin panel is accessible at `/admin`. It provides order management, customer list, template management, and design browser.

## Testing Admin Access

1. Set `ADMIN_EMAIL=your@email.com` in Vercel environment variables
2. Sign in at `https://www.stampelo.com/account` with that email
3. Navigate to `https://www.stampelo.com/admin` — should load the admin panel
4. Sign in with a different email → `/admin` should return 403 Forbidden

## Promoting Additional Admins

```sql
UPDATE users SET role = 'admin' WHERE email = 'other@email.com';
```
