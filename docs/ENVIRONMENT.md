# Environment Variables

Copy `.env.example` to `.env.local` for local development.

## Variable Reference

### Application
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL (https://www.stampelo.com) |
| `NODE_ENV` | Yes | `development` or `production` |

### Database
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |

### Authentication
| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | Auth.js secret (32+ random bytes) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `RESEND_API_KEY` | Yes | Resend API key for magic links |
| `ADMIN_EMAIL` | Yes | Email address that receives admin role on first sign-in |

### Stripe
| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (frontend) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |

### Storage
| Variable | Required | Description |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Yes (prod) | Vercel Blob token (auto-injected by Vercel) |
| `BLOB_BASE_URL` | Yes (prod) | Vercel Blob store base URL |

## Generating AUTH_SECRET

```bash
openssl rand -base64 32
```
