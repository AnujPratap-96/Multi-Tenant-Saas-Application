# 🧠 Task Manager SaaS – Backend Architecture

A **production-grade, multi-tenant task manager backend** built with **Node.js, Express, PostgreSQL, and Prisma**, designed with **security, scalability, and auditability** in mind.

This project follows **real SaaS architecture principles**, not tutorial shortcuts.

---

## 🗺️ Database Architecture (ER Diagram)

![Database ER Diagram](./Untitled.png)

---

## 🚀 Core Goals

- Multi-tenant architecture (one user → multiple organizations)
- Role-based access control (ADMIN / MANAGER / USER)
- Secure authentication with OTP verification
- Strong audit logging (who did what, when)
- API versioning (future-proof)
- Centralized error handling and rate limiting
- Clean, modular, scalable structure

---

## 📁 Project Structure Overview

---
task-manager-saas/
│
├─ prisma/
│   ├─ schema.prisma        # Database schema (single source of truth)
│   ├─ migrations/          # Prisma-generated DB migrations
│
├─ prisma.config.ts         # Prisma CLI config (only TS file)
│
├─ src/
│   ├─ app.js               # Express app configuration
│   ├─ server.js            # Server bootstrap
│
│   ├─ config/
│   │   ├─ env.js
│   │   ├─ constants.js
│   │   └─ version.js
│
│   ├─ lib/
│   │   ├─ prisma.js
│   │   ├─ logger.js
│   │   ├─ redis.js
│   │   └─ mailer.js
│
│   ├─ middlewares/
│   │   ├─ auth.middleware.js
│   │   ├─ tenant.middleware.js
│   │   ├─ rateLimit.middleware.js
│   │   ├─ error.middleware.js
│   │   └─ audit.middleware.js
│
│   ├─ modules/
│   │   ├─ auth/
│   │   ├─ tenants/
│   │   ├─ users/
│   │   ├─ projects/
│   │   ├─ tasks/
│   │   └─ audit/
│
│   ├─ utils/
│   │   ├─ asyncHandler.js
│   │   ├─ apiError.js
│   │   ├─ response.js
│   │   └─ otp.js
│
│   └─ routes.js
│
├─ .env
├─ package.json
└─ README.md

---


---

## 🔐 Architecture Principles

### Multi-Tenancy
- Every core business entity is tenant-scoped
- Tenant isolation enforced via middleware and queries

### RBAC
- Roles are stored in `tenant_users`
- A user can have different roles across tenants

### Audit Logs
- All critical actions are logged
- Logs are append-only and immutable

### API Versioning
- All endpoints are versioned (`/api/v1`)
- Enables backward compatibility

### Error Handling
- Centralized error handling
- No sensitive data exposed to clients

---

## 🔄 Typical Request Flow

---
## Request
```bash
 → Rate Limiter
 → Auth Middleware
 → Tenant Resolver
 → Permission Check
 → Controller
 → Audit Logger
 → Response
```
---


---

## 🛠 Tech Stack
```bash
- Node.js (JavaScript)
- Express.js
- PostgreSQL
- Prisma ORM
- Redis
- JWT Authentication
- Pino / Winston
```
---

## ▶️ How to Run (Development)

```bash
npm install
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
npm run dev
```

## 🚨 Rules

* Roles must not be stored in `users`
* Audit logs must never be skipped
* Tenant data must never be mixed
* All new APIs must be versioned
* Prefer middleware over controller logic

---

## 📌 Status

This backend architecture is **stable and extensible**.
New features can be added without redesigning core systems.


