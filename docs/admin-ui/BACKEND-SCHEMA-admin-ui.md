# Cykruit Admin UI — Backend Schema & API Reference

| | |
|---|---|
| **Product** | Cykruit Admin Dashboard (`admin-ui/`) |
| **Date** | 2026-07-09 |
| **Status** | Active — reflects the Admin-identity architecture (see docs/CONTEXT.md for the decision log) |
| **Related docs** | [PRD](PRD-admin-ui.md) · [TRD](TRD-admin-ui.md) · [App Flow](APP-FLOW-admin-ui.md) · [UI/UX Brief](UIUX-BRIEF-admin-ui.md) · [Implementation Plan](IMPLEMENTATION-PLAN-admin-ui.md) |

## 1. Architecture

- **API**: `admin-app/` (NestJS 11), port `4010` (`ADMIN_PORT`), single feature module `admin-app/src/admin/admin.module.ts` — controllers backed by service + repository pairs.
- **Database**: admin-app owns **no schema of its own** — it consumes the main app's Prisma schema (`admin-app/package.json` runs `prisma generate --schema=../cykruit-app/prisma/schema.prisma`) against the same Postgres DB.
- **Identity**: console staff are **`Admin` rows** (`admins` table) — fully separate from platform `User`s. `UserRole.ADMIN` on `User` is reserved for a future employer-company-admin concept in the main app.
- **Auth**: admin-app owns it. `POST /admin/auth/login` checks `Admin` (bcrypt, `isActive`), creates an `AdminSession` (opaque token stored **hashed** via `hashToken` from `@cykruit/auth-core`), sets HttpOnly `admin_session_token` cookie (SameSite=Lax). `AdminAuthGuard` validates the cookie on every request and attaches `req.admin`. No CSRF in v1 (accepted trade-off), no dependency on the main auth-service.
- **RBAC**: fully separated `Admin*` table set (§3.3); deny-by-default pipeline in `PermissionsService`; `@RequirePermission()` + `PermissionsGuard` on every route (controller-level, after `AdminAuthGuard` — never global).
- **Auditing**: console mutations and permission denials write **`AdminAuditLog`** via `admin-app/src/admin/services/admin-audit.logger.ts`. The main app's `AuditLog` is not touched by the console.
- **Response envelope** (`@cykruit/common` `ResponseInterceptor`): every response is `{ success: true, data, message?, path? }`; paginated endpoints return `data: { items: [...], pagination: {...} }`; errors return `{ success: false, error }`. Strict validation (`whitelist + forbidNonWhitelisted`): unknown body/query fields → 400.

### Separation principle

| Concern | Admin console (admin-app) | Main app (reserved, other dev) |
|---|---|---|
| Identity | `Admin` / `AdminSession` | `User` / `Session` |
| RBAC catalog | `AdminPermission` / `AdminRbacRole` / `AdminRolePermission` | `Permission` / `RbacRole` / `RolePermission` |
| RBAC grants | `AdminRoleAssignment` / `AdminPermissionOverride` | `UserRoleAssignment` / `UserPermissionOverride` (employer-scoped) |
| Audit | `AdminAuditLog` | `AuditLog` |

The two columns never mix — no shared rows, no scope flags, independent migrations/seeds.

## 2. Enums (from `cykruit-app/prisma/schema.prisma`)

| Enum | Values |
|---|---|
| `UserRole` | `SEEKER` · `EMPLOYER` · `ADMIN` (⚠ `ADMIN` = future employer-company admin; **not** the console admin) |
| `AccountStatus` | `PENDING` (email unverified) · `ACTIVE` · `INACTIVE` (self-deactivated) · `PENDING_DELETION` (30-day grace) · `SUSPENDED` (admin action) · `DELETED` |
| `VerificationStatus` | `PENDING` · `UNDER_REVIEW` · `APPROVED` · `REJECTED` |
| `JobStatus` | `DRAFT` · `PENDING` (awaiting admin approval) · `APPROVED` (live) · `REJECTED` · `CLOSED` · `EXPIRED` (auto after 45 days) |
| `EmployerSubscription.status` | plain string: `ACTIVE` \| `EXPIRED` \| `CANCELLED` |
| `AdminAuditLog.riskLevel` | plain string: `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `AdminAuditLog.result` | plain string: `SUCCESS` \| `FAILURE` \| `DENIED` |

## 3. Models

### 3.1 Console identity

**Admin** (`admins`): `id` uuid · `email` @unique · `password` (bcrypt) · `firstName` `lastName` · `phone?` · `profileImage?` · **`isActive` (default true — kill switch for staff accounts)** · `lastLogin?` `lastLoginIp?` · timestamps. Relations: `sessions`, `auditLogs`, `roleAssignments`, `permissionOverrides`, `verificationReviews`.

**AdminSession** (`admin_sessions`): `id` · `adminId` · `token` (hashed, @unique) · `expiresAt` · `rememberMe` · `userAgent?` `ipAddress?` · `lastActivity` · `createdAt`. Cascade-deleted with the admin; expired sessions deleted on validation.

**AdminAuditLog** (`admin_audit_logs`): `id` · `adminId`/`admin` · `action` · **`module`** · `resource?` `resourceId?` (target entity) · `oldData?`/`newData?` Json · **`riskLevel`** (default LOW) · **`result`** (default SUCCESS) · **`reason?`** · `ipAddress?` `userAgent?` · `metadata?` · `createdAt`.

### 3.2 Console RBAC (all FK `admins`, global scope — no employer scoping)

- **AdminPermission** (`admin_permissions`): `module` + `action` (@@unique pair) · `description?` · `isActive`.
- **AdminRbacRole** (`admin_rbac_roles`): `name` @unique · `description?` · `isActive` · timestamps.
- **AdminRolePermission** (`admin_role_permissions`): `roleId` × `permissionId` (@@unique, both Cascade).
- **AdminRoleAssignment** (`admin_role_assignments`): `adminId` × `roleId` (@@unique) · `expiresAt?` · `assignedBy?`.
- **AdminPermissionOverride** (`admin_permission_overrides`): `adminId` × `permissionId` (@@unique) · `grant: boolean` · `reason?` · `grantedBy?`.

### 3.3 Platform models the console reads/moderates

(Unchanged — see `cykruit-app/prisma/schema.prisma` for full definitions.)

- **User** (`users`) — role/status/lastLogin etc.; target of user management. Its `roleAssignments`/`permissionOverrides`/`auditLogs` relations belong to the **main-app** RBAC set and are not used by the console.
- **EmployerVerification** (`employer_verifications`) — KYC: company snapshot, single S3 document, `status`, `isLatest`, `submissionCount`, review fields (`reviewedBy` → **Admin** ✓ correct under this architecture), `statusHistory` Json[], re-verification chain.
- **Job** (`jobs`) — moderation via `JobStatus`; `rejectionReason`, counters, relations to skills/certifications/applications.
- **Application**, **SubscriptionPackage** (Decimal prices serialize as strings), **EmployerSubscription** (one per employer, cached usage counters).

## 4. API endpoint reference

Base URL (dev): `http://127.0.0.1:4010`, reached from admin-ui as `/api/admin/*` ([TRD §3](TRD-admin-ui.md)). Pagination params always optional: `page` (1-based), `limit` (max 100). All endpoints except login require a valid admin session; permissions per route noted.

### 4.1 Auth — `auth/admin-auth.controller.ts`

| Method & path | Guard / permission | Body / behavior |
|---|---|---|
| `POST /admin/auth/login` | public | `{ email, password, rememberMe? }` → sets `admin_session_token` cookie; returns `{ admin: {id,email,firstName,lastName} }`. Generic 401 "Invalid credentials" on any failure. |
| `POST /admin/auth/logout` | session only | Deletes the session, clears the cookie. |
| `GET /admin/me` | session only | `{ user: {id,email,firstName,lastName}, roles: string[], isSuperAdmin, permissions: string[] }` — the UI's gating source. |

### 4.2 Dashboard — `GET /admin/dashboard` — `dashboard:view`

Stats shape (from `dashboard.repository.ts`): `{ users: { total, seekers, employers }, jobs: { active, pendingApproval }, kyc: { pendingReview }, applications: { total }, subscriptions: { active } }` + 30-day registration/job trends.

### 4.3 Users — platform user management

| Method & path | Permission | Query / body |
|---|---|---|
| `GET /admin/users` | `users:view` | `role?: UserRole`, `status?: AccountStatus`, `q?`, `page?`, `limit?` (20) |
| `GET /admin/users/:id` | `users:view` | — |
| `PATCH /admin/users/:id/suspend` | `users:suspend` | `{ reason?: string }` |
| `PATCH /admin/users/:id/unsuspend` | `users:suspend` | `{ reason?: string }` |

### 4.4 KYC — `kyc:view` (GETs) / `kyc:review` (PATCHes)

`GET /admin/kyc` (`status?`, `page?`, `limit?` 20) · `GET /admin/kyc/:id` · `PATCH /admin/kyc/:id/approve` `{ adminNotes? }` · `PATCH /admin/kyc/:id/reject` `{ rejectionReason!, adminNotes? }`.

### 4.5 Jobs — `jobs:view` / `jobs:review`

`GET /admin/jobs` (`status?`, `q?`, `page?`, `limit?` 20) · `GET /admin/jobs/:id` · `PATCH /admin/jobs/:id/approve` `{ adminNotes? }` · `PATCH /admin/jobs/:id/reject` `{ reason!, adminNotes? }`.

### 4.6 RBAC — `rbac:view` (GETs) / `rbac:manage` (mutations)

| Method & path | Body |
|---|---|
| `GET /admin/rbac/roles` · `GET /admin/rbac/roles/:id` | — |
| `POST /admin/rbac/roles` → 201 | `{ name, description?, permissionIds?: uuid[] }` |
| `PATCH /admin/rbac/roles/:id` | `{ name?, description?, isActive? }` — **system roles: rename/deactivate rejected 403** |
| `PATCH /admin/rbac/roles/:id/permissions` | `{ permissionIds: uuid[] }` (replaces set) — **rejected for `super_admin`** |
| `GET /admin/rbac/permissions` | — (AdminPermission catalog) |
| `GET /admin/rbac/admins` | — (admin accounts: id, email, name, isActive — for the assignment UI) |
| `POST /admin/rbac/admin-roles` → 201 | `{ adminId: uuid, roleId: uuid, expiresAt? }` |
| `DELETE /admin/rbac/admin-roles/:id` | `:id` = assignment id |
| `GET /admin/rbac/admins/:adminId/roles` | — |
| `POST /admin/rbac/permission-overrides` → 201 | `{ adminId: uuid, permissionId: uuid, grant: boolean, reason? }` |
| `GET /admin/rbac/admins/:adminId/permission-overrides` | — |

### 4.7 Subscriptions — `subscriptions:view` / `subscriptions:manage`

Packages: `GET /admin/subscriptions/packages` (`isActive?`) · `GET packages/:id` · `POST packages` (201) · `PATCH packages/:id` · `DELETE packages/:id` (204). Subscriptions: `GET /admin/subscriptions` (`status?`, paging) · `GET :id` · `GET employer/:employerId` · `POST assign` · `PATCH :id/status` `{ status }`. (Thin controller — deeper logic lives in subscription-service :4008.)

### 4.8 Audit logs — `audit:view`

`GET /admin/audit-logs` — query: `riskLevel?: LOW|MEDIUM|HIGH|CRITICAL`, `result?: SUCCESS|FAILURE|DENIED`, `module?`, `adminId?`, `resourceId?`, `page?`, `limit?` (50). Reads **`AdminAuditLog`** with `admin` (id, email, firstName, lastName) included.

## 5. RBAC enforcement spec

### 5.1 Permission catalog (registry: `admin-app/src/admin/rbac/permissions.registry.ts`)

| Module | Actions |
|---|---|
| `dashboard` | `view` |
| `users` | `view`, `suspend` |
| `kyc` | `view`, `review` |
| `jobs` | `view`, `review` |
| `subscriptions` | `view`, `manage` |
| `rbac` | `view`, `manage` |
| `audit` | `view` |

### 5.2 System roles (seeded by `npm run rbac:seed`, idempotent)

| Role (`name`) | Grants |
|---|---|
| `super_admin` | pipeline bypass — everything, present and future |
| `platform_admin` | every permission except `rbac:manage` |
| `reviewer` | `dashboard:view`, `users:view`, `kyc:view`, `kyc:review`, `jobs:view`, `jobs:review` |

Seeder: upsert `AdminPermission` catalog from the registry → upsert the three roles + `AdminRolePermission` sets → assign `super_admin` to the `admins` row matching `RBAC_BOOTSTRAP_ADMIN_EMAIL`. Seeded roles are protected in service logic (no rename/deactivate; `super_admin` permission set locked).

### 5.3 Evaluation pipeline (`PermissionsService.checkOrThrow(adminId, action)`)

1. Resolve + cache (15 s TTL, invalidated on RBAC mutations): active unexpired `AdminRoleAssignment`s + `AdminPermissionOverride`s.
2. `super_admin` role → **allow** (bypass).
3. Explicit **deny** override → **403** (deny always wins).
4. Explicit **grant** override → allow.
5. Permission in any assigned role → allow.
6. Otherwise → **403** + `AdminAuditLog` (`result: "DENIED"`).

## 6. Known gaps

1. **No login lockout / rate limiting** on `POST /admin/auth/login` yet (main auth-service has it; fast follow).
2. **No CSRF** in v1 — SameSite=Lax + same-origin proxy (TRD §4.6).
3. **Admin accounts are seed-only** — `cykruit-app/prisma/seed.js` `seedAdmins()` (default `admin@cykruit.com / Admin@123`).
4. **`UserRole.ADMIN` still means "platform admin" in a few main-app spots** (e.g. subscription-service admin guard) — to be revisited by the main-app developer when employer-company-admin lands.
5. **`RbacListQueryDto` pagination is ignored** by `listRoles()` (accepted, not applied).
