# Cykruit Admin UI — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Cykruit Admin Dashboard (`admin-ui/`) |
| **Date** | 2026-07-09 |
| **Status** | Draft |
| **Related docs** | [TRD](TRD-admin-ui.md) · [App Flow](APP-FLOW-admin-ui.md) · [UI/UX Brief](UIUX-BRIEF-admin-ui.md) · [Backend Schema](BACKEND-SCHEMA-admin-ui.md) · [Implementation Plan](IMPLEMENTATION-PLAN-admin-ui.md) |

## 1. Overview

Cykruit is a job platform built exclusively for the cybersecurity community. The platform already has:

- **`cykruit-app/`** — the main NestJS microservices backend (auth, seekers, employers, jobs, notifications, subscriptions) behind a gateway on `:5000`.
- **`cykruit-ui/`** — the main Next.js frontend (`:3000`) for job seekers and employers.
- **`admin-app/`** — a complete, standalone NestJS admin API (`:4010`, deploys to `admin-api.cykruit.com`) exposing user management, employer KYC review, job moderation, RBAC, subscription management, dashboard analytics, and audit logs.

What is missing is the **admin frontend**. Today there is no UI anywhere in the repo that consumes `admin-app` — admins have no way to operate the platform except direct API/database access.

**This product is `admin-ui/`**: a new Next.js application, sibling to `cykruit-ui`, mirroring its tech stack and conventions, that gives platform administrators a full dashboard over the existing `admin-app` API. It runs on port **3100** locally and deploys to **`admin.cykruit.com`** (both already whitelisted in `admin-app`'s CORS config — see `admin-app/src/main.ts`).

## 2. Users

All users are internal Cykruit staff with an account in the dedicated **`Admin` model** (`admins` table) — completely separate from platform `User` accounts. There is no public signup; admin accounts are provisioned by seed (v1). Platform users cannot log in to the console at all: it authenticates only against `admins`, with its own session store (`admin_sessions`).

> Note: `UserRole.ADMIN` on the platform `User` model is **not** the console admin. It is reserved for a future "employer-company admin" concept in the main app (to be implemented by another developer).

Within the admin console, staff are further differentiated by **RBAC roles** (stored in the existing `RbacRole`/`Permission` tables and enforced per the architecture in `rbac_comprehensive_reference.md`). Three default roles ship with the system:

| Default role | Intent | Permissions |
|---|---|---|
| **Super Admin** (`super_admin`) | Platform owners; full control including RBAC itself | All (evaluation-pipeline bypass) |
| **Platform Admin** (`platform_admin`) | Day-to-day operations staff | Everything except `rbac:manage` (can view RBAC config, not change it) |
| **Reviewer** (`reviewer`) | Moderation staff | `dashboard:view`, `users:view`, `kyc:view`, `kyc:review`, `jobs:view`, `jobs:review` |

Roles are database-managed, so new roles can be created at runtime (F6) without code deploys. Per-user grant/deny overrides refine any role — an explicit deny always wins.

## 3. Problems this solves

1. **Employer KYC is a manual bottleneck.** Employer verifications (`EmployerVerification`) pile up with no review interface — employers can't get verified, which blocks them from posting.
2. **Job moderation is blind.** Jobs submit into `PENDING` status and need admin approval before going live; there is no queue view or approve/reject workflow.
3. **No operational visibility.** Platform health (user counts, pending queues, application volume, active subscriptions) is only reachable via SQL.
4. **No safe user administration.** Suspending an abusive account or investigating a user requires raw DB writes with no audit trail surfaced.
5. **RBAC and subscription plans are dark features.** The backend fully supports roles/permissions and subscription packages, but nothing can manage them.

## 4. Feature requirements (v1)

The v1 scope is the surface the `admin-app` API exposes, including its own authentication (F1) and RBAC enforcement (F9); see [Backend Schema](BACKEND-SCHEMA-admin-ui.md) for the full API/schema spec. Features listed in priority order.

### F1 — Admin authentication (self-contained)
- Login with email + password via `POST /admin/auth/login` on **admin-app itself** — credentials checked against the `Admin` model (bcrypt); no dependency on the main auth-service.
- On success, admin-app issues an opaque session token stored hashed in `AdminSession` and set as an HttpOnly `admin_session_token` cookie (SameSite=Lax).
- After login, fetch the admin's identity **and resolved permission set** (`GET /admin/me`) — the UI adapts navigation and actions to it (F9).
- Sign out via `POST /admin/auth/logout` (revokes the session, clears the cookie).
- All routes except `/login` require an authenticated admin session. Deactivated admins (`Admin.isActive = false`) cannot log in and their sessions stop validating.

### F2 — Overview dashboard (`GET /admin/dashboard`)
- Stat cards: total active users (split seekers/employers), active jobs, jobs pending approval, KYC pending review, total applications, active subscriptions.
- Registration trend (last 30 days, grouped by role) and approved-job trend.
- Pending-work shortcuts: cards for "jobs pending" and "KYC pending" deep-link into those queues.

### F3 — User management (`/admin/users`)
- Paginated, filterable user table: filter by `role` (SEEKER/EMPLOYER/ADMIN), `status` (PENDING/ACTIVE/INACTIVE/PENDING_DELETION/SUSPENDED/DELETED), free-text search `q`.
- User detail view (profile, status, last login, linked employer/seeker profile).
- **Suspend / unsuspend** with optional reason (recorded to audit log by the backend).

### F4 — Employer KYC review (`/admin/kyc`)
- Verification queue (default: PENDING, `isLatest` only), filterable by status, paginated.
- Detail view: company snapshot (name, website, type, industry, size, location), the uploaded verification document (S3 URL — viewable/downloadable), submission count, prior verification chain, status history.
- **Approve** (optional `adminNotes`) and **Reject** (required `rejectionReason`, optional `adminNotes`).

### F5 — Job moderation (`/admin/jobs`)
- Moderation queue (default: PENDING), filterable by `JobStatus`, searchable, paginated.
- Job detail: full posting (title, employer, type, work mode, experience level, description, skills, screening questions).
- **Approve** (optional `adminNotes`) and **Reject** (required `reason`, optional `adminNotes`).

### F6 — RBAC management (`/admin/rbac`) — requires `rbac:manage`
- Roles list; create/edit role (name, description, isActive); attach/detach permissions per role.
- Permissions catalog (read-only list, grouped by module).
- Assign roles to users (optional employer scope, optional expiry); revoke assignments; view a user's roles.
- Per-user permission overrides (grant/deny a specific permission, with reason); view a user's overrides.
- The three default roles (§2) are seeded as system roles (`isSystem`-style protection: they cannot be deleted, and `super_admin`'s permissions cannot be edited from the UI).

### F7 — Subscription management (`/admin/subscriptions`)
- Package CRUD: name, description, maxActiveJobs, maxTeamMembers, featuredJobSlots, aiScoringEnabled, priceMonthly/priceYearly, isActive; delete package.
- Employer subscriptions: list (filter ACTIVE/EXPIRED/CANCELLED), detail, look up by employer, **assign** a package to an employer, change subscription status.

### F8 — Audit log viewer (`/admin/audit-logs`)
- Paginated table of `AuditLog` entries with filters: riskLevel (LOW/MEDIUM/HIGH/CRITICAL), result (SUCCESS/FAILURE/DENIED), actorRole, module, actorId, targetId.
- Row expansion showing oldData/newData JSON diff, reason, IP address.
- Denied permission checks (F9) are logged with `result: DENIED` and appear here.

### F9 — RBAC enforcement (backend + frontend)

Turn the RBAC tables from managed data into enforced policy, per `rbac_comprehensive_reference.md`:

- **Permission registry** — single typed source of truth (`module:action` strings) shared conceptually by backend and UI; see [Backend Schema §7](BACKEND-SCHEMA-admin-ui.md) for the full list.
- **Backend enforcement** — every admin endpoint declares a required permission; a deny-by-default evaluation pipeline resolves Super-Admin bypass → explicit deny → explicit grant → role permissions, with denials written to `AuditLog`.
- **Seeded defaults** — idempotent seeder upserts the permission catalog and the three default roles (§2); runs on deploy.
- **Frontend gating** — sidebar items, pages, and action buttons render only when the logged-in admin holds the required permission (`usePermissions` / `<RequirePermission>`). The UI never duplicates evaluation logic; it consumes the resolved permission list from `GET /admin/me`.
- A Reviewer who deep-links to `/subscriptions` sees a "You don't have access to this section" state — and the API would refuse anyway.

## 5. Non-goals (v1)

- **Admin account management** (create/invite admins, password reset for admins) — no backend endpoints exist.
- **Content management** (Blog, GalleryItem, Event, ContactForm models) — not in the admin API.
- **Messaging/notifications to users, impersonation, data export** — not in the admin API.
- **Dark mode** — `cykruit-ui` is light-mode only; admin-ui matches.
- **Mobile-first optimization.** Responsive down to tablet is required; phone layouts are best-effort (admins work on desktops).

## 6. Success criteria

1. An admin can log in at `localhost:3100`, and a non-admin cannot get past login.
2. Every endpoint in the [Backend Schema doc](BACKEND-SCHEMA-admin-ui.md) is reachable from the UI (all 7 modules fully wired — no mock data).
3. A KYC submission and a pending job can each be taken from queue → detail → approve/reject, and the result is visible in the audit log viewer.
4. The app is visually indistinguishable in style from `cykruit-ui`'s employer dashboard (same tokens, shell, components).
5. Playwright smoke tests cover login, dashboard load, and one approve/reject flow.
6. RBAC enforcement holds end-to-end: a `reviewer` admin sees only Dashboard/Users/KYC/Jobs in the sidebar, gets a 403 (and a DENIED audit entry) when calling a subscriptions endpoint directly, and a per-user deny override on `jobs:review` blocks an otherwise-permitted Platform Admin.

## 7. Known gaps / risks

- **No login lockout / rate-limit parity yet** — admin-app's login endpoint does not implement the failed-attempt lockout the main auth-service has. Mitigations: admin accounts are seed-provisioned and few; add rate limiting as a fast follow.
- **No CSRF protection in v1** — admin-app mutations rely on the `admin_session_token` cookie being SameSite=Lax plus the same-origin Next proxy. Acceptable for v1; revisit if the API is ever exposed cross-origin.
- **Admin account management is seed-only** — no create/invite/password-reset UI (per §5 non-goals); disabling staff is done via `Admin.isActive`.
- **`UserRole.ADMIN` semantics** — reserved for a future employer-company admin in the main app. A few main-app spots (e.g. subscription-service's admin guard) still treat it as "platform admin" and must be revisited by that developer.
- **Subscription logic is thin** in `admin-app` (real logic lives in subscription-service `:4008`); UI should treat responses defensively.
- **Schema deltas vs the reference guide**: `AdminRbacRole` has no `slug`/`isSystem` columns and `AdminPermission` no `riskLevel`. v1 matches seeded roles by `name` with service-level protection; adding the columns is an optional follow-up migration.
