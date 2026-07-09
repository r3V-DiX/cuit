# Cykruit Admin UI — Technical Requirements Document (TRD)

| | |
|---|---|
| **Product** | Cykruit Admin Dashboard (`admin-ui/`) |
| **Date** | 2026-07-09 |
| **Status** | Draft |
| **Related docs** | [PRD](PRD-admin-ui.md) · [App Flow](APP-FLOW-admin-ui.md) · [UI/UX Brief](UIUX-BRIEF-admin-ui.md) · [Backend Schema](BACKEND-SCHEMA-admin-ui.md) · [Implementation Plan](IMPLEMENTATION-PLAN-admin-ui.md) |

## 1. Stack (pinned to match `cykruit-ui`)

`admin-ui/` is a sibling app to `cykruit-ui/` and pins the **same versions** (source of truth: `cykruit-ui/package.json`):

| Concern | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | `16.2.9` |
| Runtime UI | React / React DOM | `19.2.4` |
| Language | TypeScript | `^5` |
| Styling | Tailwind CSS v4 (CSS-first, `@theme inline`, **no** `tailwind.config`) | `^4` + `@tailwindcss/postcss ^4` |
| Icons | `lucide-react` (primary), `react-icons` (fallback) | `^1.20.0` / `^5.6.0` |
| Lint | eslint + `eslint-config-next` | `^9` / `16.2.9` |
| E2E tests | Playwright | `^1.61.0` |
| State mgmt | **None** — React Context providers only (Toast/Modal), matching `cykruit-ui` | — |
| Data fetching | Native `fetch` to same-origin `/api/*` (no axios, no react-query) | — |
| Forms | Plain `useState` + manual validation (no form lib) | — |

> ⚠️ Next.js 16 warning (from `cykruit-ui/AGENTS.md`): this Next version has breaking changes vs. common knowledge — notably **`proxy.ts` replaces `middleware.ts`**. Consult `node_modules/next/dist/docs/` before writing framework-touching code.

Folder conventions (identical to `cykruit-ui`): flat top level — `app/`, `components/`, `lib/`, `public/`; no `src/`; path alias `@/*` in `tsconfig.json`.

## 2. Ports & environments

| Env | admin-ui | admin-app API |
|---|---|---|
| Local dev | `http://localhost:3100` | `http://127.0.0.1:4010` |
| Production | `https://admin.cykruit.com` | `https://admin-api.cykruit.com` |

Port 3100 is mandated by `admin-app`'s CORS allowlist (`admin-app/src/main.ts` — `http://localhost:3100`, `https://admin.cykruit.com`). Dev script: `next dev -p 3100`. **The main auth-service is not involved** — admin-app owns authentication (§4).

Environment variables (`.env.local`):

```bash
ADMIN_SERVICE_URL=http://127.0.0.1:4010   # admin-app (auth + all admin endpoints)
```

Use `127.0.0.1`, not `localhost`, in rewrite targets — commit `a338944` switched `cykruit-ui` to `127.0.0.1` to fix ECONNREFUSED (Node 20 resolves `localhost` to `::1` first).

## 3. API integration

All browser calls go to same-origin `/api/*`, proxied via `next.config.ts` rewrites (same pattern as `cykruit-ui/next.config.ts`):

```ts
// admin-ui/next.config.ts
const ADMIN_URL = process.env.ADMIN_SERVICE_URL || "http://127.0.0.1:4010";

async rewrites() {
  return [
    { source: "/api/admin/:path*", destination: `${ADMIN_URL}/admin/:path*` },
  ];
}
```

So `fetch("/api/admin/users?role=EMPLOYER&page=1")` hits `GET http://127.0.0.1:4010/admin/users?...`, and login is `POST /api/admin/auth/login`.

### Response envelope

`admin-app` wraps every response via `@cykruit/common`'s `ResponseInterceptor`/`ResponseBuilder` (`cykruit-app/libs/common/src/utils/response-builder.util.ts`):

```jsonc
// success
{ "success": true, "data": { ... }, "message": "...", "path": "/admin/users" }
// paginated success
{ "success": true, "data": { "items": [ ... ], "pagination": { ... } } }
// error (GlobalExceptionFilter / ValidationExceptionFilter)
{ "success": false, "error": { ... } }
```

The UI must unwrap `data` and branch on `success`. A small shared helper in `lib/api.ts` (thin `fetch` wrapper: `credentials: "include"` implicit for same-origin, JSON parsing, envelope unwrap, 401 → redirect to `/login`) is the one deliberate improvement over `cykruit-ui`'s inline-fetch style — admin-ui has ~30 endpoints and repeating the unwrap inline would be error-prone. Keep it dependency-free.

### Validation behavior

`admin-app` runs a strict global `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true` — `admin-app/src/main.ts`). **Never send extra body/query fields**; requests with unknown fields are rejected 400. Query params `page`/`limit` are transformed numbers (`limit` max 100). Payloads must match the DTOs in [Backend Schema §3](BACKEND-SCHEMA-admin-ui.md) exactly.

## 4. Authentication & authorization

Admin-app owns the entire auth stack — admins are **`Admin` rows** (`admins` table), never platform `User`s:

1. **Login** — `POST /api/admin/auth/login` `{ email, password, rememberMe? }`. admin-app checks the `Admin` row (`isActive`, bcrypt compare), creates an `AdminSession` (opaque token stored **hashed** via auth-core's `hashToken` util), and sets an HttpOnly **`admin_session_token`** cookie (`SameSite=Lax`, `Secure` in prod). Proxied through Next, so the cookie lands on the admin-ui origin.
2. **Permissions load** — after login, `GET /api/admin/me` returns identity + resolved RBAC permission set into `PermissionsProvider`.
3. **Route protection** — `admin-ui/proxy.ts` (Next 16's middleware replacement): if no `admin_session_token` cookie and the path is not `/login`, redirect to `/login?redirect=<path>`. API routes pass through (client handles 401).
4. **Session validation on every call** — `AdminAuthGuard` hashes the cookie token, looks it up in `admin_sessions` (not expired), loads the `Admin` (`isActive`), attaches `req.admin`. Expired sessions are deleted on sight.
5. **Logout** — `POST /api/admin/auth/logout` deletes the session row and clears the cookie, then hard-redirect to `/login`.
6. **No CSRF in v1** — accepted trade-off: `SameSite=Lax` cookie + same-origin proxy. No `x-csrf-token` header anywhere in admin-ui.

## 5. RBAC enforcement architecture

Reference: `rbac_comprehensive_reference.md`. Implemented on a **fully separated admin RBAC table set** (FK `admins`): `AdminPermission`, `AdminRbacRole`, `AdminRolePermission`, `AdminRoleAssignment`, `AdminPermissionOverride`. The user-side set (`Permission`, `RbacRole`, `RolePermission`, `UserRoleAssignment`, `UserPermissionOverride`, FK `users`) is untouched and **reserved for future main-app RBAC** — the two catalogs never mix.

### 5.1 Backend additions (admin-app)

| Piece | Detail |
|---|---|
| **Permission registry** | `admin-app/src/admin/rbac/permissions.registry.ts` — typed `ACTIONS` constant, `module:action` strings (full catalog in [Backend Schema §7](BACKEND-SCHEMA-admin-ui.md)). No raw strings in checks. |
| **`PermissionsService`** | `resolveUserPermissions(adminId)`: load `AdminRoleAssignment`s (unexpired, role active) + `AdminRolePermission`s + `AdminPermissionOverride`s; return `{ roles, isSuperAdmin, permissions: Set<string>, denied: Set<string> }`. Short-TTL in-memory cache + explicit invalidation on RBAC mutations. |
| **Evaluation pipeline** | Deny-by-default, strict precedence: ① `super_admin` role → allow all; ② explicit deny override → 403; ③ explicit grant override → allow; ④ role permissions → allow if present; ⑤ otherwise 403 + `AdminAuditLog` entry with `result: "DENIED"`. |
| **`PermissionsGuard` + `@RequirePermission()`** | Decorator on every controller route (e.g. `@RequirePermission(ACTIONS.KYC.REVIEW)`); guard runs after `AdminAuthGuard` (controller-level, **never** as `APP_GUARD` — it must run after auth attaches `req.admin`). Routes without the decorator require only a valid admin session (`/admin/me`, logout). |
| **`GET /admin/me`** | Returns `{ user: {id, email, firstName, lastName}, roles: string[], isSuperAdmin, permissions: string[] }` — the UI's single source for gating. |
| **Seeder** | `npm run rbac:seed` (idempotent upserts): syncs the `AdminPermission` catalog from the registry, upserts the three default roles + their `AdminRolePermission` sets, and assigns `super_admin` to the bootstrap admin (`RBAC_BOOTSTRAP_ADMIN_EMAIL`, matched against the `admins` table). Runs in CI/CD and local setup. |
| **System-role protection** | Service-level: the three seeded roles can't be renamed/deactivated; `super_admin`'s permission set can't be edited. |

### 5.2 Frontend consumption (admin-ui)

The frontend **never re-implements evaluation** — it consumes the resolved list from `/api/admin/me`:

- `lib/permissions.ts` — mirror of the registry's string constants (typed union) for compile-time safety.
- `PermissionsProvider` (in `components/ui/Providers.tsx`) — fetches `/api/admin/me` once after login, exposes `usePermissions()` → `{ has(action), isSuperAdmin, roles }`.
- `<RequirePermission action="...">` — wrapper component that hides children lacking the permission (buttons, nav items); pages render a full "no access" state instead of content.
- Defense in depth: hiding UI is UX, not security — the API 403s regardless. Any 403 from `/api/admin/*` renders the "You don't have access" state, never a crash.

## 6. Production note

`admin-app` issues its own sessions, so the only requirement is keeping the cookie first-party: `admin.cykruit.com` must run the Next rewrites server-side (standalone/node server, **not** static export) so browser → admin-ui origin → internal admin-app URL. Do **not** rely on cross-site cookies to `admin-api.cykruit.com`; if a direct-to-API architecture is ever wanted, the cookie would need `Domain=.cykruit.com` + `SameSite=None` **and CSRF protection first** — out of scope for v1.

## 7. Cross-cutting requirements

- **Pagination**: standard `page` (1-based) / `limit` params; render from `data.pagination`. Default limits mirror the DTOs (20 for users/kyc/jobs/subscriptions, 50 for audit/rbac).
- **Errors**: every fetch surfaces failures via the shared Toast (pattern: `cykruit-ui/components/ui/Toast.tsx`); validation 400s show the message array; 401 redirects to login; 403 renders the "You don't have access" state (§5.2).
- **Loading/empty states**: skeleton or spinner per table/card; explicit empty-state copy per queue ("No pending verifications 🎉").
- **Timeouts**: admin-app has a 30 s server timeout (`TimeoutInterceptor`); no client retry logic in v1.
- **Security**: never store tokens in JS-accessible storage (cookies are HttpOnly); no secrets in the client bundle; all admin data is behind auth — no public pages except `/login`.
- **TypeScript**: shared response/entity types hand-written in `lib/types.ts` from the Prisma models documented in [Backend Schema](BACKEND-SCHEMA-admin-ui.md) (admin-ui does not depend on `@prisma/client`).
- **Testing**: Playwright smoke suite (login, dashboard render, one moderation flow, reviewer-role gating) runnable against local services.

## 8. Explicitly out of scope (technical)

- No shared code package between `cykruit-ui` and `admin-ui` (repo has no workspace tooling); UI primitives are copied, not imported.
- No SSR data fetching of admin data (all admin pages are client components fetching after mount, matching `cykruit-ui`'s dashboards); marketing-style static pages don't exist here.
- No WebSocket/notification integration in v1.
