# Task Manager SaaS — Backend

Multi-tenant task manager API built with **Node.js, Express, PostgreSQL (Prisma), and Redis**, with tenant isolation, RBAC, OTP/Google auth, and full audit logging.

## Stack

- Node.js 22 (ESM), Express
- PostgreSQL via Prisma ORM (Supabase)
- Redis (BullMQ queues, OTP/session caches, membership/settings caches)
- Zod validation, Passport (Google OAuth), express-rate-limit
- Vitest (unit tests), Swagger (OpenAPI docs)

## Setup

```bash
cp .env.example .env   # fill in credentials
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed     # RBAC permission matrix + default roles
npm run dev
```

### Environment

All variables are validated by `src/config/env.js` (Zod). Key notes:

- `DATABASE_URL` — runtime connection (Supabase pooler, port 6543, `pgbouncer=true`)
- `DIRECT_URL` — direct connection (port 5432). **Always use this for migrations** — the pooler hangs on `prisma migrate deploy`.
- `REDIS_URL` — Redis for queues and caches
- `JWT_*_SECRET` — must be >= 32 chars
- `CSRF_SECRET` — required, no fallback (fail-fast if missing)
- `ALLOWED_ORIGINS` — comma-separated CORS allowlist; credentialed requests require it
- `FRONTEND_URL` — used for OAuth redirects
- `TRUST_PROXY` — set `true` behind a reverse proxy so `req.ip` is correct
- `BREVO_API_KEY` — transactional email (OTP/invites)

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with hot reload |
| `npm start` | Start in production |
| `npm run test:unit` | Vitest unit tests (`tests/unit/`) |
| `npx prisma migrate deploy` | Apply migrations (use `DIRECT_URL`) |
| `npx prisma db seed` | Seed RBAC permissions/roles |

## Architecture

- `src/index.js` — bootstrap: DB connect, Redis connect, queue workers, HTTP server, graceful shutdown (`src/lib/shutdown.js` owns all signal handling)
- `src/app.js` — Express app: CORS allowlist, CSRF, rate limits, tenant middleware chain, versioned routes under `/api/v1`
- `src/middlewares/` — `auth.middleware` (JWT), `tenant.middleware` (`resolveTenant`/`requireTenant`), `rbac.middleware` (`requirePermission`), `otpRateLimit`, `validate` (400 contract), CSRF, error handler
- `src/lib/` — `prisma` (lazy singleton), `redis`, `audit.logger` (`logAudit` — single audit entry point), `sendEmail`, `jwt`, `shutdown`
- `src/modules/` — feature modules: `auth`, `tenant` (incl. invites + settings), `users`, `projects`, `tasks`, `rbac`, `audit-log`, `dashboard`, `health`, `queue` (BullMQ: email + audit workers)
- `src/utils/` — `requestContext` (uses `req.ip`, no header spoofing), `api-error`, `response`, `cookies`

### Request flow

```
Rate limiter -> Auth (JWT access token) -> Tenant resolver -> Permission check -> Controller -> Service -> Audit log -> Response
```

## Security model

- **Tenant isolation**: every query scoped by `tenantId` from the token/context; cache keys include `tenantId`; membership cache invalidated on suspend/remove/role change
- **RBAC**: `requirePermission('resource', 'action')` middleware + service-level guards; roles are `ADMIN | MANAGER | USER` (enum only — custom roles out of scope)
- **Auth**: OTP login/signup/reset with per-email send limits and per-request verification limits (no account enumeration); refresh tokens cookie-only, rotated per session; OAuth with `state` CSRF cookie; passwordless Google accounts
- **Audit**: append-only `AuditLog`; CSV export quotes/escapes every field and neutralizes formula injection
- **Shutdown**: single module closes HTTP server, workers, Redis, and Prisma on SIGINT/SIGTERM

## Tests

```bash
npm run test:unit
```

Unit tests cover auth (passwordless/OTP enumeration guards), validation contract, RBAC role updates, error utilities, and tenant helpers. E2E suites (`tests/e2e/`) exist for isolation/invites/rbac but are **destructive** (truncate tables + flush Redis) — run only against a disposable database.

## API Docs

Swagger UI: `http://localhost:5000/api/v1/docs`
