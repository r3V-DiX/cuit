# Cykruit Monorepo Context

## Overview
This repository contains the Cykruit platform services (`cykruit-app`, `admin-app`, `admin-ui`, etc).

## Architecture

### Admin Identity & RBAC (Implemented July 2026)
The admin console (`admin-app` / `admin-ui`) operates on a fully separated architecture:
- **Identity**: Admin console staff log in as `Admin` models (from the `admins` table). The `User` model with `role=ADMIN` is reserved for a future employer-company-admin concept in the main app.
- **Authentication**: `admin-app` owns its own session logic, creating `AdminSession` rows. The admin console does not depend on the main auth-service.
- **RBAC**: The admin console uses a dedicated set of tables: `AdminPermission`, `AdminRbacRole`, `AdminRolePermission`, `AdminRoleAssignment`, and `AdminPermissionOverride`. The standard `Permission` / `RbacRole` / `UserRoleAssignment` tables are reserved for the main application and are untouched by the console.
- **Auditing**: Console mutations log to `AdminAuditLog` (`admin_audit_logs` table), fully separate from the main app's `AuditLog`. See "Audit Logging" below for the full three-source model and the rule for wiring new mutations.

### Audit Logging (three sources — July 2026)

admin-ui's Audit Logs page has three tabs, each backed by a distinct table/writer. **When adding any new mutation endpoint anywhere in the platform, check this table and wire in the matching writer as part of that change — do not ship a mutation without an audit entry.**

| Tab | Table | Written by | Actor FK | When to use |
|---|---|---|---|---|
| Audit Logs (auth) | `AuthAuditLog` + `AdminAuthAuditLog` (merged) | `cykruit-app/libs/audit/src/audit.service.ts` → `AuditService.log()` (main app) / `admin-app/src/admin/services/admin-auth-audit.logger.ts` → `AdminAuthAuditLogger.log()` (console) | `User` / `Admin` (nullable) | Login, logout, OTP, register, account deactivate/delete — auth-adjacent events only. Already wired into every auth flow; new auth events add an `AuditAction` enum value in `audit.types.ts` and call `AuditService.log()`. |
| System Logs | `AuditLog` (`audit_logs`) | `cykruit-app/libs/audit/src/audit.service.ts` → `AuditService.logAction()` | `User` (**hard FK — actor must be a platform User, never an Admin**) | Any business-mutation endpoint in `cykruit-app` performed by a seeker or employer: jobs, KYC, team, company profile, applications, settings, subscriptions (where the actor is a legacy `User(role=ADMIN)`, e.g. `subscription-service`'s `AdminGuard`). |
| Admin Activity Logs | `AdminAuditLog` (`admin_audit_logs`) | `admin-app/src/admin/services/admin-audit.logger.ts` → `AdminAuditLogger.log()` | `Admin` | Any mutation inside `admin-app` performed by console staff (kyc:approve, jobs:review, users:suspend, rbac:manage, etc). |

**Wiring pattern for a new `cykruit-app` mutation** (System Logs): inject `AuditService` from `@cykruit/audit` into the service, call `this.auditService.logAction({ actorId, actorRole, action: '<module>:<verb>', module: '<MODULE>', targetType, targetId, oldData?, newData?, result: 'SUCCESS', ipAddress?, metadata? })` right after the write succeeds. It's fire-and-forget and never throws — safe to call unconditionally. If the owning service's module doesn't already import `AuditModule` from `@cykruit/audit`, add it (check each `apps/*/src/*/*.module.ts` first — `employer-service`, `seeker-service`, and `auth-service` already have it; `seeker-profile-service`, `user-settings-service`, and `subscription-service` needed it added).

**Gotcha**: per-service `tsconfig.build.json` files that override `paths` (rather than inheriting from root `tsconfig.json`) must list `"@cykruit/audit": ["libs/audit/src/index.ts"]` explicitly, or `ts-node-dev`/build will fail with `Cannot find module '@cykruit/audit'` even though the root `tsconfig.json` has it. Hit and fixed for `subscription-service` (July 2026) — check any new/other per-service `tsconfig.build.json` for the same gap before assuming a missing-module error is a real dependency issue.

**Deliberately not instrumented** (low incident-investigation value, revisit if that changes): `saved-jobs` (bookmark toggle), seeker profile sub-resources beyond core `profile`/`resume` (experience, education, skills, certifications, projects, CTF profiles — self-service content curation), notification/messaging services (product activity, not security-relevant).

## Decisions & Rationale
- **`admin-app` env loading (July 2026)**: `import 'dotenv/config'` must remain the
  first import in `admin-app/src/main.ts`. The `@prisma/client` used by `admin-app`
  is the one generated in `cykruit-app/node_modules` (path-mapped via
  `tsconfig-paths-bootstrap.js`), and its generated client auto-loads
  `cykruit-app/.env` at import time. Without the preload, any key present in both
  `.env` files (e.g. `CORS_ORIGIN`, `JWT_SECRET`) is silently taken from
  `cykruit-app/.env` instead of `admin-app/.env`. See `docs/SESSION_MEMORY.md`.
- **`AdminAuditLogger.newData` typing**: DTO instances are cast
  `as unknown as Prisma.InputJsonValue` at call sites (`testimonials.service.ts`)
  because class-validator DTO classes lack the index signature `InputJsonValue`
  requires; the DTOs contain only JSON-safe primitives.

### Admin UI ↔ API full coverage (July 2026)
Every admin-app endpoint is now exercised by admin-ui. Conventions established:
- List endpoints return `{ items, pagination: { page, limit, total, totalPages } }` — enforced across audit, testimonials, users, kyc, subscriptions repositories.
- Text search: backend DTOs use `q` (users/jobs/kyc/subscriptions/testimonials) except audit DTOs which use `search`; the audit page maps its `q` URL param to `search` when calling.
- Frontend mirrors live in `admin-ui/lib/permissions.ts` (ACTIONS, SYSTEM_ROLE_NAMES) — keep in sync with `admin-app/src/admin/rbac/permissions.registry.ts`.
- Create/edit forms are co-located client components in their route folder (e.g. `testimonials/TestimonialForm.tsx`, `rbac/RoleForm.tsx`, `subscriptions/PackageForm.tsx`, `subscriptions/AssignSubscriptionForm.tsx`) rendered inside the Modal `content` slot with their own submit buttons.
- UI enforces backend guardrails visually: system roles (no rename/deactivate), super_admin (locked permission matrix), packages (no rename on edit).

### Prisma migration baseline (July 2026)
The database was originally created via `prisma db push`, so `_prisma_migrations` had no
history and `migrate status` reported everything (incl. `init`) as pending. Baselined with
`prisma migrate resolve --applied` for `20260331112315_init` and
`20260707060827_add_employer_member_subscription_rbac_audit`, then `migrate deploy` applied
`20260708111703_add_testimonials`. From now on use `prisma migrate dev` for schema changes —
never `db push` — and never accept a `migrate dev` reset prompt against this shared dev DB.

## Schema Changes

### Billing & Payment Models (July 2026)
- New enums: `BillingCycle` (MONTHLY/YEARLY), `PaymentOrderStatus` (CREATED/PAID/FAILED/EXPIRED), `PaymentStatus` (CAPTURED/FAILED/REFUNDED)
- `EmployerSubscription` gets `billingCycle BillingCycle?` and `paymentOrders PaymentOrder[]`
- `SubscriptionPackage` gets `paymentOrders PaymentOrder[]` back-relation
- `Employer` gets `paymentOrders PaymentOrder[]` back-relation
- New model `PaymentOrder`: stores Razorpay order ID, amount in paise (base + GST + total), billing cycle, status, 15-min TTL
- New model `Payment`: stores `razorpayPaymentId`, signature, CAPTURED/FAILED/REFUNDED status
- Migration: `20260710110531_add_billing_payment_models`

## Billing Architecture

### Free tier auto-activation (July 2026)
- `employer-service` `CompanyService.setupCompany()` fires `EMPLOYER_SETUP_COMPLETE` event via Bull/Redis
- `subscription-service` `EmployerEventsProcessor` consumes it and calls `PaymentService.activateFreeTierIfEligible()`
- Free tier = `SubscriptionPackage` where `priceMonthly IS NULL AND priceYearly IS NULL` (seed the "Free" package with no price)
- Event-driven, not HTTP: zero coupling between services

### Razorpay payment flow (July 2026)
- `POST /subscriptions/orders` — employer creates order; returns `razorpayOrderId + key_id` for frontend Razorpay checkout
- Razorpay calls `POST /subscriptions/webhook` on capture/failure — raw body required; signature verified via HMAC-SHA256
- On `payment.captured`: assigns/renews subscription with correct expiry (monthly +1 month, yearly +1 year), creates `Payment` row, marks order PAID, fires events
- GST: 18% added on top of base price; stored separately (`amountPaise` + `gstAmountPaise` + `totalAmountPaise` all in paisa)
- Currency: INR only
- Env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — required in `subscription-service`

### CSP nonce (fe-6, July 2026)
- `unsafe-inline` removed from `script-src` and `style-src`
- Nonce generated per-request in `proxy.ts` via `crypto.randomUUID()`
- Nonce set as `x-nonce` response header + full CSP header with `'nonce-<value>'`
- `next.config.ts` no longer sets a static CSP
- `app/layout.tsx` reads nonce from `await headers()` and passes to `<Providers>`

## Known Issues / Deviations
- **`admin-app` `start:prod` is broken** (pre-existing): the build emits
  `dist/admin-app/src/main.js` + `dist/cykruit-app/libs/**` (lib sources live
  outside the project root), so `node dist/main.js` finds nothing — and emitted
  JS keeps `@cykruit/*` specifiers that Node cannot resolve without a runtime
  path mapper. Needs a prod strategy (dist-aware bootstrap, bundling, or npm
  workspaces). Dev (`start:dev`) is unaffected.
- ~~`tsconfig.build.json` 49 errors~~ **fixed (July 2026)**: the build config
  overrode `paths` with a stale copy (TS replaces, never merges, `paths`) missing
  `@cykruit/events` / `@prisma/client` / `.prisma/client` / `bcryptjs`; the
  override was deleted so it inherits from `tsconfig.json`. Do not re-add `paths`
  to `tsconfig.build.json`.
- ~~`admin.guard.ts` dead code~~ **removed (July 2026)**: it was still imported by
  `TestimonialsController`, which was on the old `AuthGuard`+`AdminGuard`/
  `req.user` pattern (broken at runtime — nothing sets `req.user`). The controller
  was migrated to `AdminAuthGuard` + `PermissionsGuard` + `@CurrentAdmin`, with new
  registry actions `testimonials:view` / `testimonials:manage` (requires
  `npm run rbac:seed` to upsert).
- ~~No CSRF in Admin Console v1~~ **CSRF enabled (July 2026)**: `AuthCoreModule.forRoot({ enableCsrf: true })` registers `CsrfGuard` app-wide in `admin-app`. Login is `@Public` (exempt — no session exists yet; still throttled) and issues a non-HttpOnly `csrf_token` cookie alongside the session cookie; `admin-ui/lib/api.ts` echoes it as `x-csrf-token` on POST/PATCH/PUT/DELETE. Logout clears both cookies.
- **Admin Rate Limiting**: Throttler module with `@LoginRateLimit` applied to `POST /admin/auth/login`. Lockout is not yet implemented (fast follow).
- **Admin Accounts are seed-only**: Currently admins must be created directly via SQL or `seed.js`.
