# Testing

## Test Suite

| Suite | Tool | Count | Command |
|---|---|---|---|
| Unit / Integration | Vitest | 84 tests (5 files) | `pnpm test` |
| E2E | Playwright | ~23 tests x 4 browsers | `pnpm test:e2e` |

**Current status (2026-08-07): 84/84 Vitest tests passing.**

## Vitest Coverage

| File | What it tests |
|---|---|
| `server/auth.logout.test.ts` | Auth logout procedure |
| `server/exportService.test.ts` | PNG/SVG/EPS/PDF/DOCX generation |
| `server/webhookHandler.test.ts` | Stripe webhook signature verification, idempotency, fulfillment |
| `server/entitlement.test.ts` | Plan entitlement matrix (32 cases) |
| `client/src/editor/svgUtils.test.ts` | SVG renderer, React hook order regression |

## Running Tests

```bash
pnpm test          # Run all Vitest tests once
pnpm test --watch  # Watch mode
pnpm test:e2e      # Playwright E2E (requires running server)
```

## Playwright E2E

Browsers: Chromium, Firefox, WebKit, Mobile Chrome.

Covers: homepage, editor, template drawer, account page, download modal.
