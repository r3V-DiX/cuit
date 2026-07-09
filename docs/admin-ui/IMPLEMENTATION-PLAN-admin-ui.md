# Cykruit Admin UI — Implementation Plan

| | |
|---|---|
| **Product** | Cykruit Admin Dashboard (`admin-ui/`) |
| **Date** | 2026-07-09 |
| **Status** | Phases 0–8 completed. Phase 8 (Admin-identity migration) is finished and live. |
| **Related docs** | [PRD](PRD-admin-ui.md) · [TRD](TRD-admin-ui.md) · [App Flow](APP-FLOW-admin-ui.md) · [UI/UX Brief](UIUX-BRIEF-admin-ui.md) · [Backend Schema](BACKEND-SCHEMA-admin-ui.md) |

## Ground rules

- Mirror `cykruit-ui` exactly: same dependency versions (`cykruit-ui/package.json`), flat `app/`/`components/`/`lib/` layout, Tailwind v4 CSS-first theme, hand-rolled UI primitives, native `fetch`.
- **Next.js 16 caveat**: `proxy.ts` not `middleware.ts`; check `node_modules/next/dist/docs/` before using any framework API from memory (per `cykruit-ui/AGENTS.md`). Copy an `AGENTS.md` + `CLAUDE.md` (`@AGENTS.md`) into `admin-ui/` too.
- No mock data at any phase — every screen is wired to the live API from the start (read-only screens first so this is practical).
- **RBAC (PRD F9)** is part of the build: Phase 1 adds the enforcement layer to `admin-app` (the only backend work in this plan), and every UI phase afterwards gates buttons/nav with `RequirePermission` as it builds them — gating is not retrofitted at the end. Design: [Backend Schema §7](BACKEND-SCHEMA-admin-ui.md), [TRD §5](TRD-admin-ui.md), reference `rbac_comprehensive_reference.md`.
- Reference implementations to copy/adapt (do not import across apps): login page `cykruit-ui/app/login/page.tsx`, shell `cykruit-ui/app/(employer)/layout.tsx` + `components/employer/EmployerSidebar.tsx`/`EmployerTopbar.tsx`, primitives `cykruit-ui/components/ui/*`, guard `cykruit-ui/proxy.ts`, rewrites `cykruit-ui/next.config.ts`.

### Prerequisites (each dev session)

```powershell
docker-compose up postgres redis -d          # repo root
cd cykruit-app;  node prisma/seed.js          # seeds admins table: admin@cykruit.com / Admin@123
cd admin-app;    npm run rbac:seed            # admin permission catalog + system roles + bootstrap super_admin
cd admin-app;    npm run start:dev            # admin API :4010 (owns login — auth-service NOT needed)
cd admin-ui;     npm run dev                  # :3100
```

---

## Phase 0 — Scaffold (`admin-ui/` skeleton)

**Create:**
- `admin-ui/package.json` — name `cykruit-admin-ui`; deps copied verbatim from `cykruit-ui/package.json`; scripts: `"dev": "next dev -p 3100"`, `"start": "next start -p 3100"`, build/lint same.
- `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`, `.gitignore` — copied from `cykruit-ui`.
- `next.config.ts` — two rewrites only: `/api/auth/:path*` → `AUTH_SERVICE_URL` (default `http://127.0.0.1:4001`), `/api/admin/:path*` → `ADMIN_SERVICE_URL` (default `http://127.0.0.1:4010`). **Use 127.0.0.1** (TRD §2).
- `app/globals.css` — token block copied from `cykruit-ui/app/globals.css` (keep brand/status tokens, grid + orb utilities for login; drop unused landing animations if convenient).
- `app/layout.tsx` (fonts + Providers), `app/page.tsx` (redirect → `/dashboard`), `app/not-found.tsx`.
- `AGENTS.md`, `CLAUDE.md`, `.env.local.example`.

**Verify:** `npm run dev` serves `http://localhost:3100`; `/` redirects to `/dashboard` (404s for now — fine); `curl http://localhost:3100/api/admin/dashboard` returns admin-app's 401 JSON (proves rewrite works).

## Phase 1 — RBAC enforcement backend (`admin-app/`)

The only backend phase; can run in parallel with Phase 0. Full design in [Backend Schema §7](BACKEND-SCHEMA-admin-ui.md).

**Create (in `admin-app/src/admin/`):**
- `rbac/permissions.registry.ts` — typed `ACTIONS` constant + `Action` union (reference guide §3); catalog per Backend Schema §7.1.
- `services/permissions.service.ts` — `resolveUserPermissions(userId)` (roles + overrides, active/unexpired, request-scoped cache) and `checkOrThrow(userId, action)` implementing the deny-by-default pipeline (super_admin bypass → deny override → grant override → role permission → 403 + DENIED audit entry).
- `guards/permissions.guard.ts` + `decorators/require-permission.decorator.ts` — `@RequirePermission(ACTIONS.KYC.REVIEW)` on **every** existing route per the mapping in Backend Schema §7.2 (edit all 7 controllers).
- `controllers/me.controller.ts` — `GET /admin/me` returning `{ user, roles, isSuperAdmin, permissions }`.
- `prisma/rbac-seed.ts` + npm script `rbac:seed` — idempotent upsert of permission catalog, three default roles (`super_admin`, `platform_admin`, `reviewer`) with their `RolePermission` sets, bootstrap `super_admin` assignment via `RBAC_BOOTSTRAP_ADMIN_EMAIL`.
- Service-level protection: seeded roles can't be deleted/renamed; `super_admin` permission set not editable.

**Verify (curl/REST client, before any UI exists):** seed twice (idempotent — no duplicates); `GET /admin/me` as bootstrap admin shows `isSuperAdmin: true`; an admin with only `reviewer` gets 200 on `GET /admin/jobs`, 403 on `GET /admin/subscriptions` (and a `result: DENIED` row appears in `audit_logs`); a deny override on `jobs:review` beats a role grant; an admin with **no** role assignment gets 403 on everything except `/admin/me`.

## Phase 2 — Auth + permissions context (`admin-ui/`)

**Create:**
- `lib/api.ts` — thin fetch wrapper: JSON, envelope unwrap (`{success, data}`), throws typed `ApiError`, 401 → redirect `/login` (TRD §3).
- `lib/types.ts` — hand-written types for enums + entities from [Backend Schema §2–3](BACKEND-SCHEMA-admin-ui.md); `lib/permissions.ts` — mirror of the action string constants.
- `app/login/page.tsx` — adapted from `cykruit-ui/app/login/page.tsx`: email/password only; on success `GET /api/auth/me` → non-ADMIN gets logout + "Admin access only" error; then `GET /api/admin/me` → `PermissionsProvider` (App Flow §2.1); honors `?redirect=`.
- `PermissionsProvider` + `usePermissions()` hook + `<RequirePermission>` + `NoAccess` component (TRD §5.2, UI/UX Brief §4).
- `proxy.ts` — adapted from `cykruit-ui/proxy.ts`: no `session_token` cookie + non-`/login` page path → redirect `/login?redirect=...`.

**Verify:** login with the bootstrap super_admin reaches `/dashboard`; login with a SEEKER account is bounced with the admin-only message; `usePermissions().has()` returns correct values for a reviewer account; visiting `/users` logged-out redirects to login and back after login.

## Phase 3 — Shell & UI kit

**Create:**
- `app/(admin)/layout.tsx` — sidebar+topbar shell (clone of employer layout).
- `components/admin/AdminSidebar.tsx`, `AdminTopbar.tsx` — per [UI/UX Brief §3](UIUX-BRIEF-admin-ui.md) (nav items **filtered by permission**, collapse, mobile overlay, sign-out w/ CSRF, "ADMIN CONSOLE" brand tag; topbar identity + RBAC role pill from `/api/admin/me`).
- `components/ui/` — copy `Button`, `Badge`, `Modal`, `Toast`, `SearchBox`, `Providers` from cykruit-ui; build new `Table`, `Pagination`, `FilterBar`, `StatCard`, `StatusBadge`, `ConfirmModal`, `EmptyState`, `Skeleton`, `JsonViewer` (UI/UX Brief §4–5).

**Verify:** as super_admin all 7 sidebar routes render (placeholder pages); as reviewer only Dashboard/Users/KYC/Jobs appear and deep-linking `/subscriptions` shows `NoAccess`; collapse/expand + mobile overlay work; sign-out logs out and redirects.

## Phase 4 — Read-only modules (wire the easy 3 first)

**Create:**
- `app/(admin)/dashboard/page.tsx` — `GET /api/admin/dashboard` → StatCards + pending-work shortcut links (`/jobs?status=PENDING`, `/kyc?status=PENDING`); feed sidebar badges.
- `app/(admin)/audit-logs/page.tsx` — filterable table, URL-synced filters, expandable rows with `JsonViewer`.
- `app/(admin)/users/page.tsx` — FilterBar (role/status/q) + table + pagination.

**Verify:** with seeded data, dashboard numbers match DB counts; every filter combination round-trips through the URL; pagination matches `data.pagination`.

## Phase 5 — Action modules (moderation workflows)

**Create:**
- `app/(admin)/users/[id]/page.tsx` — detail + suspend/unsuspend ConfirmModal (optional reason; buttons behind `users:suspend`).
- `app/(admin)/kyc/page.tsx` + `kyc/[id]/page.tsx` — queue, detail (company snapshot, document link, statusHistory timeline, previous-submission chain), approve/reject modals behind `kyc:review` (reject: required `rejectionReason`).
- `app/(admin)/jobs/page.tsx` + `jobs/[id]/page.tsx` — queue, read-only posting preview, approve/reject modals behind `jobs:review` (reject: required `reason`).

**Verify (end-to-end):** submit a job + KYC doc as a test employer in `cykruit-ui`; approve/reject them in admin-ui as a **reviewer** account; confirm the employer sees the outcome in `cykruit-ui` and the actions appear in `/audit-logs`. Suspend a test user and confirm their login fails; confirm a reviewer sees no suspend button (`users:suspend` not granted).

## Phase 6 — RBAC & subscriptions UI (complex forms)

**Create:**
- `app/(admin)/rbac/page.tsx` (Roles/Permissions tabs, create-role modal), `rbac/roles/[id]/page.tsx` (edit + permission checklist grouped by module; system roles read-only per App Flow §3.5), `rbac/users/[userId]/page.tsx` (assignments + overrides; linked from user detail). Mutations behind `rbac:manage`; refetch `/api/admin/me` after self-affecting changes.
- `app/(admin)/subscriptions/packages/page.tsx` (package CRUD; remember Decimal-as-string prices), `subscriptions/page.tsx` (list + assign modal), `subscriptions/[id]/page.tsx` (detail + status change). Mutations behind `subscriptions:manage`.

**Verify:** create a custom role → attach permissions → assign to a test admin → log in as them and confirm the UI matches; revoke. Confirm `platform_admin` sees RBAC read-only (no mutation buttons) and system roles can't be deleted. Create package → assign to employer → change status → delete unused package. Watch for strict-validation 400s (no extra fields).

## Phase 7 — Polish & tests

- Empty/loading/error states audit across all pages; keyboard/focus pass on modals; toast coverage on every mutation.
- Playwright smoke suite (`admin-ui/e2e/`): login (admin ok / seeker rejected), dashboard renders stats, one job approve flow, audit log shows the action, **reviewer gating** (sidebar hides Subscriptions/RBAC; `/subscriptions` deep-link shows NoAccess).
- Update `RUNNING.md` (add admin-ui: port 3100, env vars, `rbac:seed`, start command) and add `admin-ui/README.md`.

**Verify:** `npx playwright test` green against locally running auth-service + admin-app; full manual click-through of PRD success criteria §6 (including criterion 6, RBAC end-to-end).

---

## Phase 8 — Admin-identity migration (ACTIVE)

Migrates the console from `User(role=ADMIN)` + shared `Session` auth to the **`Admin` model** with fully separated RBAC/audit tables. Decisions: admins are `Admin` rows; `Admin*` RBAC set (no shared catalog, no scope column); `AdminAuditLog` for the console, `AuditLog` reserved for the main app; `UserRole.ADMIN` re-documented as future employer-company admin. Full spec: [Backend Schema](BACKEND-SCHEMA-admin-ui.md), [TRD §4–5](TRD-admin-ui.md).

**8a — Schema** (`cykruit-app/prisma/schema.prisma`): `Admin.isActive`; `AdminAuditLog` + `module`/`riskLevel`/`result`/`reason`; new `AdminPermission`/`AdminRbacRole`/`AdminRolePermission`/`AdminRoleAssignment`/`AdminPermissionOverride`; comment on `UserRole.ADMIN`. Then `prisma migrate dev --name admin-identity-rbac` + regenerate both clients.

**8b — admin-app auth** (`src/admin/auth/`): login/logout controller + service (bcryptjs vs `admins`, hashed opaque token in `AdminSession`, HttpOnly `admin_session_token` SameSite=Lax cookie), `AdminAuthGuard`, `@CurrentAdmin`. Remove `AuthCoreModule`/`AdminSessionValidator`/`AdminGuard` and the erroneous `APP_GUARD` registration of `PermissionsGuard`.

**8c — admin-app RBAC/audit retarget**: `PermissionsService` + `RbacService`/repository/DTOs → `Admin*` models (`adminId`); routes `admin-roles`, `admins/:adminId/...`, new `GET /admin/rbac/admins`; system-role protection; `AdminAuditLogger` → `AdminAuditLog` (`resource`/`resourceId`); audit query DTO/repository updated; `rbac-seed` bootstraps from `admins`.

**8d — admin-ui**: single-call login → `/api/admin/auth/login`; proxy cookie `admin_session_token`; drop `/api/auth/*` rewrite + CSRF header logic; RBAC pages `rbac/admins/[adminId]` + Admins tab; audit page columns (`resourceId`, no actorRole); sign-out endpoint.

**Verify**: seeds → login `admin@cykruit.com / Admin@123` → super_admin sees all; reviewer-only admin sees 4 sidebar items, 403 + DENIED audit row on `/admin/subscriptions`; deny-override beats role grant; KYC approve writes `reviewedBy` without FK error; logout clears session. Typechecks green on admin-app + admin-ui.

## Risks / watch-outs

| Risk | Mitigation |
|---|---|
| Next 16 API drift (proxy.ts, async request APIs) | Read bundled docs first; copy working patterns from cykruit-ui, not memory |
| Strict backend validation rejects extra fields | Build payloads exactly from [Backend Schema §4](BACKEND-SCHEMA-admin-ui.md); never spread state objects into bodies |
| No ADMIN user seeded locally | Add/verify an admin seed in `cykruit-app/prisma/seed` before Phase 1 verification |
| Adding `@RequirePermission` breaks existing admin flows | Phase 1 verification covers every route with a reviewer + super_admin account before UI work starts; seeded `super_admin` on the bootstrap admin preserves current full access |
| Admin locked out (no roles assigned after enforcement lands) | `rbac:seed` always (re)assigns `super_admin` to `RBAC_BOOTSTRAP_ADMIN_EMAIL`; document re-running it as the recovery path |
| Registry and DB drift (renamed/removed permissions) | Seeder is the single sync point — upserts from the registry on every deploy; never edit `permissions` rows by hand |
| Stale permissions in UI after role edits | `PermissionsProvider` refetches `/api/admin/me` after self-affecting RBAC mutations; backend remains authoritative (403s regardless) |
| Prisma `Decimal` prices arrive as strings | Parse/format in package UI |
| `reviewedBy` doesn't join to `User` (legacy Admin FK) | Display as opaque ID or omit (Backend Schema §6.3) |
| Production cookie domain (admin.cykruit.com vs auth) | v1 relies on server-side rewrites keeping cookies first-party (TRD §5) — do not static-export |
