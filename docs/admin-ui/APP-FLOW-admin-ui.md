# Cykruit Admin UI — App Flow Document

| | |
|---|---|
| **Product** | Cykruit Admin Dashboard (`admin-ui/`) |
| **Date** | 2026-07-09 |
| **Status** | Draft |
| **Related docs** | [PRD](PRD-admin-ui.md) · [TRD](TRD-admin-ui.md) · [UI/UX Brief](UIUX-BRIEF-admin-ui.md) · [Backend Schema](BACKEND-SCHEMA-admin-ui.md) · [Implementation Plan](IMPLEMENTATION-PLAN-admin-ui.md) |

## 1. Route tree

Mirrors `cykruit-ui`'s route-group convention: an `(admin)` group provides the dashboard shell (sidebar + topbar); `/login` sits outside it with no chrome.

```
admin-ui/app/
├── layout.tsx                    # root layout (fonts, globals.css, Providers)
├── page.tsx                      # "/" → redirect to /dashboard
├── not-found.tsx
├── globals.css
├── login/
│   └── page.tsx                  # admin login (no shell)
└── (admin)/                      # route group — requires session (proxy.ts)
    ├── layout.tsx                # AdminSidebar + AdminTopbar shell
    ├── dashboard/page.tsx        # F2 overview
    ├── users/
    │   ├── page.tsx              # F3 user table
    │   └── [id]/page.tsx         # user detail + suspend/unsuspend
    ├── kyc/
    │   ├── page.tsx              # F4 verification queue
    │   └── [id]/page.tsx         # verification detail + approve/reject
    ├── jobs/
    │   ├── page.tsx              # F5 moderation queue
    │   └── [id]/page.tsx         # job detail + approve/reject
    ├── rbac/
    │   ├── page.tsx              # F6 roles list (+ permissions catalog + admins tabs)
    │   ├── roles/[id]/page.tsx   # role detail: edit + permission matrix
    │   └── admins/[adminId]/page.tsx  # an admin's roles + overrides
    ├── subscriptions/
    │   ├── page.tsx              # F7 employer subscriptions list
    │   ├── packages/page.tsx     # package list + create/edit/delete
    │   └── [id]/page.tsx         # subscription detail + status change
    └── audit-logs/
        └── page.tsx              # F8 filterable audit table (expandable rows)
```

Sidebar order: Dashboard · Users · KYC · Jobs · Subscriptions · RBAC · Audit Logs.

**Permission-gated navigation** (PRD F9): each sidebar item and page requires a permission — Dashboard `dashboard:view` · Users `users:view` · KYC `kyc:view` · Jobs `jobs:view` · Subscriptions `subscriptions:view` · RBAC `rbac:view` · Audit Logs `audit:view`. Items the admin lacks are hidden from the sidebar; deep-linking to them renders the "no access" state (§4). Default-role visibility:

| Role | Sees |
|---|---|
| Super Admin | everything |
| Platform Admin | everything (RBAC section read-only — no create/edit/assign buttons, which need `rbac:manage`) |
| Reviewer | Dashboard · Users (read-only) · KYC · Jobs |

## 2. Authentication flows

### 2.1 Login

```
/login
  ├─ enter email + password → POST /api/admin/auth/login   (admin-app checks the admins table)
  │    ├─ 401/400 → inline error ("Invalid credentials")
  │    └─ 200 (admin_session_token HttpOnly cookie set by admin-app)
  │         └─ GET /api/admin/me → load {user, roles, isSuperAdmin, permissions[]}
  │              into PermissionsProvider → router.replace(redirect ?? "/dashboard")
  │              (if the redirect target needs a permission the admin lacks → "/dashboard")
```

Platform users simply have no row in `admins` — their credentials fail with the same generic "Invalid credentials". No registration, no OAuth, no "forgot password" (out of scope — see PRD §5).

### 2.2 Route guard (`proxy.ts`)

Every request to a page path (everything except `/login`, `/_next/*`, `/api/*`, static assets): if `admin_session_token` cookie absent → redirect `/login?redirect=<path>`. API calls returning 401 anywhere in the app → client clears state and redirects to `/login`.

### 2.3 Sign out

Sidebar footer → confirm modal → `POST /api/admin/auth/logout` (deletes the AdminSession row, clears the cookie) → hard redirect to `/login`.

## 3. Module flows

Every mutation follows the same skeleton: **action button → confirm modal (with reason field where required) → API call → toast (success/error) → refetch list/detail**. Action buttons render only inside `<RequirePermission action="...">` — a viewer-level admin sees the data but no buttons. Required permissions per flow are noted in each heading (view / mutate).

### 3.1 Dashboard (F2) — `dashboard:view`

```
/dashboard (on mount)
  └─ GET /api/admin/dashboard
       └─ render: stat cards (users/seekers/employers, active jobs, pending jobs,
                  pending KYC, applications, active subscriptions)
                  + trends (registrations by role, jobs published, last 30d)
  Pending-jobs card  → link /jobs?status=PENDING
  Pending-KYC card   → link /kyc?status=PENDING
```

### 3.2 Users (F3) — view `users:view` · suspend/unsuspend `users:suspend`

```
/users
  └─ GET /api/admin/users?role=&status=&q=&page=&limit=20
       └─ FilterBar (role select, status select, search) + table + pagination
  row click → /users/[id]
       └─ GET /api/admin/users/:id → profile card, status badge, activity info
            ├─ [Suspend]   → modal (optional reason) → PATCH /api/admin/users/:id/suspend   {reason?}
            └─ [Unsuspend] → modal (optional reason) → PATCH /api/admin/users/:id/unsuspend {reason?}
                 → toast → refetch detail
```

Suspend is shown only for non-SUSPENDED accounts; unsuspend only for SUSPENDED. Both are destructive-styled and confirm-gated.

### 3.3 KYC / Employer verification (F4) — view `kyc:view` · approve/reject `kyc:review`

```
/kyc  (default tab: PENDING)
  └─ GET /api/admin/kyc?status=PENDING&page=&limit=20
       └─ queue table: company, industry/size, submitted date, submission #, status badge
  row click → /kyc/[id]
       └─ GET /api/admin/kyc/:id
            └─ layout: company snapshot | document panel (open documentUrl in new tab)
                       | status history timeline | previous-submission link
            ├─ [Approve] → modal (optional adminNotes)
            │      → PATCH /api/admin/kyc/:id/approve {adminNotes?}
            └─ [Reject]  → modal (REQUIRED rejectionReason + optional adminNotes;
            │              submit disabled until reason filled)
            │      → PATCH /api/admin/kyc/:id/reject {rejectionReason, adminNotes?}
            └─ → toast → navigate back to /kyc (queue refetches)
```

### 3.4 Job moderation (F5) — view `jobs:view` · approve/reject `jobs:review`

```
/jobs  (default tab: PENDING)
  └─ GET /api/admin/jobs?status=PENDING&q=&page=&limit=20
       └─ queue table: title, employer, type/mode/level, created, status badge
  row click → /jobs/[id]
       └─ GET /api/admin/jobs/:id → full posting preview (read-only)
            ├─ [Approve] → modal (optional adminNotes) → PATCH /api/admin/jobs/:id/approve {adminNotes?}
            └─ [Reject]  → modal (REQUIRED reason + optional adminNotes)
            │      → PATCH /api/admin/jobs/:id/reject {reason, adminNotes?}
            └─ → toast → back to /jobs
```

### 3.5 RBAC (F6) — view `rbac:view` · all mutations `rbac:manage`

```
/rbac  (tabs: Roles | Permissions | Admins)
  ├─ Roles tab: GET /api/admin/rbac/roles
  │    ├─ [New role] → modal (name, description, permission multi-select from
  │    │               GET /api/admin/rbac/permissions) → POST /api/admin/rbac/roles
  │    └─ row click → /rbac/roles/[id]
  │         └─ GET /api/admin/rbac/roles/:id
  │              ├─ edit name/description/isActive → PATCH /api/admin/rbac/roles/:id
  │              └─ permission checklist (grouped by module)
  │                    → [Save] → PATCH /api/admin/rbac/roles/:id/permissions {permissionIds}
  ├─ Permissions tab: GET /api/admin/rbac/permissions (read-only, grouped by module)
  └─ Admins tab: GET /api/admin/rbac/admins → row click → /rbac/admins/[adminId]

/rbac/admins/[adminId]   (reached from the "Admins" tab on /rbac — list via GET /api/admin/rbac/admins)
  ├─ GET /api/admin/rbac/admins/:adminId/roles
  │    ├─ [Assign role] → modal (role select, optional expiresAt)
  │    │      → POST /api/admin/rbac/admin-roles {adminId, roleId, expiresAt?}
  │    └─ [Revoke] per row → confirm → DELETE /api/admin/rbac/admin-roles/:assignmentId
  └─ GET /api/admin/rbac/admins/:adminId/permission-overrides
       └─ [Add override] → modal (permission select, grant/deny toggle, reason)
             → POST /api/admin/rbac/permission-overrides {adminId, permissionId, grant, reason?}
```

Console roles belong to **admin accounts**, not platform users — the platform-user detail page has no roles link.

Default-role protections in the UI: `super_admin`, `platform_admin`, `reviewer` rows show a "System" badge — no delete, no rename; `super_admin` additionally hides the permission checklist (its access is a pipeline bypass, not a permission set). If the acting admin edits their own roles/overrides, refetch `/api/admin/me` afterwards so the UI re-gates immediately.

### 3.6 Subscriptions (F7) — view `subscriptions:view` · all mutations `subscriptions:manage`

```
/subscriptions/packages
  └─ GET /api/admin/subscriptions/packages
       ├─ [New package] → form modal (name, description, limits, prices, aiScoring)
       │      → POST /api/admin/subscriptions/packages
       ├─ [Edit] → same form → PATCH /api/admin/subscriptions/packages/:id
       └─ [Delete] → confirm (destructive) → DELETE /api/admin/subscriptions/packages/:id

/subscriptions
  └─ GET /api/admin/subscriptions?status=&page=&limit=20
       ├─ [Assign subscription] → modal (employerId, package select, status)
       │      → POST /api/admin/subscriptions/assign
       └─ row click → /subscriptions/[id]
            └─ GET /api/admin/subscriptions/:id → package, employer, usage counters
                 └─ [Change status] → select ACTIVE/EXPIRED/CANCELLED → confirm
                       → PATCH /api/admin/subscriptions/:id/status {status}
```

### 3.7 Audit logs (F8) — `audit:view`

```
/audit-logs   (reads AdminAuditLog — the console's own audit trail, separate from the main app's AuditLog)
  └─ GET /api/admin/audit-logs?riskLevel=&result=&module=&adminId=&resourceId=&page=&limit=50
       └─ FilterBar (riskLevel, result, module, admin) + dense table
            (time, admin, action, module, resource, riskLevel badge, result badge)
       └─ row expand → oldData/newData JSON viewer, reason, ipAddress, metadata
  Deep links: user detail "View audit trail" → /audit-logs?resourceId=<userId>
```

## 4. Global states

- **Loading**: table skeletons on first load; button spinners during mutations (button disabled while pending).
- **Empty**: per-queue friendly empty states with the active filter mentioned.
- **Error**: toast for transient errors + inline retry button on failed page loads; 401 → login redirect; 403 → "You don't have access to this section" full-page state (permission missing — sidebar stays usable).
- **No access (permission)**: pages check `usePermissions().has(<view permission>)` before fetching; lacking it renders the no-access state without calling the API. Direct API 403s (e.g. stale permission cache) render the same state.
- **Session expiry mid-use**: any 401 from `/api/admin/*` clears UI state and redirects to `/login?redirect=<current>`.
