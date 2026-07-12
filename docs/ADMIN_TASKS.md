# Admin Panel — Remaining Work & Task Assignments

> **Reference files before starting any task:**
> - Schema: `cykruit-app/prisma/schema.prisma`
> - Permissions registry (single source of truth): `admin-app/src/admin/rbac/permissions.registry.ts`
> - Audit logging guide: `docs/AUDIT_LOGGING.md`
> - Context & decisions: `docs/CONTEXT.md`
> - Session memory (past mistakes): `docs/SESSION_MEMORY.md`

---

## What Already Exists (Do NOT Rebuild)

| Area | Backend (`admin-app`) | Frontend (`admin-ui`) |
|---|---|---|
| Auth (login/logout/me) | ✅ Full | ✅ Full |
| Dashboard (stats) | ✅ Full | ✅ Full |
| Users (list, view, suspend/unsuspend) | ✅ Full | ✅ Full (list + detail page) |
| KYC (list, view, approve, reject) | ✅ Full | ✅ Full (list + detail page) |
| Jobs (list, view, approve, reject) | ✅ Full | ✅ Full (list + detail page) |
| Subscriptions (list, view, assign, status change) | ✅ Full | ✅ Full (list + detail + packages + payments pages) |
| RBAC (roles, permissions, admin assignments, overrides) | ✅ Full | ✅ Full (roles page + admin detail page) |
| Testimonials (CRUD, publish/unpublish) | ✅ Full | ✅ Full |
| Audit logs (auth, system, admin activity) | ✅ Full | ✅ Full |
| Multi-admin setup (super_admin / platform_admin / reviewer roles) | ✅ Schema + registry | ✅ RBAC page manages it |

---

## Multi-Admin Role Hierarchy (Already in Schema — Needs Seeding)

Three system roles are defined in `permissions.registry.ts`:

| Role | What They Can Do |
|---|---|
| `super_admin` | Everything. Bypasses permission pipeline entirely. Only role that can touch RBAC. |
| `platform_admin` | Everything EXCEPT managing RBAC (can't create roles or assign permissions). |
| `reviewer` | Read-only dashboard + user list + KYC approve/reject + job approve/reject. Nothing else. |

**These are already enforced by `PermissionsGuard` + `@RequirePermission()` decorators.**
Adding a new admin just requires: create their `Admin` row, then assign the appropriate `AdminRbacRole` via the RBAC page in admin-ui (or via `POST /admin/rbac/admins/:adminId/roles`).

**Action needed:** Run `npm run rbac:seed` inside `admin-app/` once to upsert these roles and permissions into the database. After that the RBAC management UI in admin-ui is fully operational.

---

## Remaining Backend Tasks

### TASK B1 — Contact Form Management
**Who needs it:** Platform admin (incoming user contact messages need review + response tracking)

**Schema model:** `ContactForm` (already in schema — no migration needed)

**What to build:**
- `admin-app/src/admin/repositories/contact.repository.ts`
  - `list(query)` — paginated, filter by `status` (PENDING/REVIEWED/RESOLVED/SPAM), search by email/name
  - `getById(id)` — single record
  - `updateStatus(id, status, adminId, notes)` — PATCH status + reviewedBy + reviewedAt
- `admin-app/src/admin/services/contact.service.ts`
  - Wraps repository, writes `AdminAuditLog` on status change
- `admin-app/src/admin/dto/contact.dto.ts`
  - `ContactListQueryDto`: page, limit, q, status
  - `UpdateContactStatusDto`: status (IsIn PENDING/REVIEWED/RESOLVED/SPAM), notes (optional)
- `admin-app/src/admin/controllers/contact.controller.ts`
  - `GET /admin/contact` — list
  - `GET /admin/contact/:id` — detail
  - `PATCH /admin/contact/:id/status` — update status

**Permissions to add to `permissions.registry.ts`:**
```
CONTACT: {
    VIEW: 'contact:view',
    MANAGE: 'contact:manage',
}
```
Add `contact:view` to `platform_admin` grants.
Add `contact:view` + `contact:manage` to `platform_admin` grants.

**Module wiring:** Add controller + service + repository to `admin.module.ts`.

---

### TASK B2 — Blog Management
**Schema model:** `Blog` (already in schema)

**What to build:** Same CRUD pattern as Testimonials.
- Repository: `list`, `getById`, `create`, `update`, `delete`
- Service: wraps repo, audit logs on create/update/delete/publish
- DTO: `BlogListQueryDto`, `CreateBlogDto`, `UpdateBlogDto`
  - `CreateBlogDto`: title (required), slug (required, unique), excerpt, content (Text), category, coverImage, isPublished
- Controller: `GET /admin/blog`, `GET /admin/blog/:id`, `POST /admin/blog`, `PATCH /admin/blog/:id`, `DELETE /admin/blog/:id`, `PATCH /admin/blog/:id/publish`, `PATCH /admin/blog/:id/unpublish`

**Permissions to add:**
```
BLOG: {
    VIEW: 'blog:view',
    MANAGE: 'blog:manage',
}
```

---

### TASK B3 — Gallery Management
**Schema model:** `GalleryItem` (already in schema)

**Same CRUD pattern.** Controller: `GET /admin/gallery`, `POST /admin/gallery`, `PATCH /admin/gallery/:id`, `DELETE /admin/gallery/:id`.

DTO: `CreateGalleryItemDto` — imageUrl (required), title, altText, isActive.

**Permissions:**
```
GALLERY: {
    MANAGE: 'gallery:manage',
}
```

---

### TASK B4 — Events Management
**Schema model:** `Event` (already in schema)

Controller: `GET /admin/events`, `GET /admin/events/:id`, `POST /admin/events`, `PATCH /admin/events/:id`, `DELETE /admin/events/:id`, `PATCH /admin/events/:id/publish`.

DTO: `CreateEventDto` — title (required), description, location, eventDate (IsDateString, required), bannerImage, isPublished.

**Permissions:**
```
EVENTS: {
    VIEW: 'events:view',
    MANAGE: 'events:manage',
}
```

---

### TASK B5 — Platform Settings (NEW schema model needed)
**What it is:** Global on/off toggles for platform features — maintenance mode, registration open/closed, job posting enabled, KYC required, etc.

**Schema additions (new migration required):**
```prisma
model PlatformSetting {
    id          String   @id @default(uuid())
    key         String   @unique  // e.g. "maintenance_mode", "registration_enabled"
    value       String           // String representation ("true"/"false"/JSON)
    description String?
    updatedBy   String?  @db.Uuid // Admin.id who last changed it
    updatedAt   DateTime @updatedAt
    createdAt   DateTime @default(now())

    @@index([key])
    @@map("platform_settings")
}
```

Controller: `GET /admin/settings` (list all), `PATCH /admin/settings/:key` (update value).

**Permissions:**
```
SETTINGS: {
    VIEW: 'settings:view',
    MANAGE: 'settings:manage',
}
```
Only `super_admin` should get `settings:manage`.

**Migration name:** `add_platform_settings`

---

### TASK B6 — Content Flagging / Reports (NEW schema model needed)
**What it is:** Users/employers can flag jobs or profiles as spam/inappropriate. Admin reviews flags.

**Schema additions (new migration required):**
```prisma
enum FlaggedContentType {
    JOB
    EMPLOYER_PROFILE
    SEEKER_PROFILE
    MESSAGE
}

enum FlagReason {
    SPAM
    INAPPROPRIATE
    MISLEADING
    FAKE_COMPANY
    HARASSMENT
    OTHER
}

enum FlagStatus {
    PENDING
    UNDER_REVIEW
    RESOLVED_REMOVED
    RESOLVED_DISMISSED
}

model ContentReport {
    id          String             @id @default(uuid())
    reporterId  String
    reporter    User               @relation(fields: [reporterId], references: [id], onDelete: Cascade)
    contentType FlaggedContentType
    contentId   String             // Job.id / Employer.id / JobSeekerProfile.id
    reason      FlagReason
    description String?            @db.Text
    status      FlagStatus         @default(PENDING)
    reviewedBy  String?            @db.Uuid
    reviewedAt  DateTime?
    adminNotes  String?            @db.Text
    createdAt   DateTime           @default(now())
    updatedAt   DateTime           @updatedAt

    @@index([contentType, contentId])
    @@index([status])
    @@index([reporterId])
    @@index([createdAt])
    @@map("content_reports")
}
```

Also add to `User` model: `contentReports ContentReport[]`

Controller: `GET /admin/reports`, `GET /admin/reports/:id`, `PATCH /admin/reports/:id/resolve`, `PATCH /admin/reports/:id/dismiss`.

**Permissions:**
```
REPORTS: {
    VIEW: 'reports:view',
    MANAGE: 'reports:manage',
}
```
Add both to `platform_admin`. Add `reports:view` to `reviewer`.

**Migration name:** `add_content_reports`

---

### TASK B7 — Admin Invite Flow (NEW schema + backend)
**What it is:** Super admin invites a new admin via email. The invited person gets a one-time setup link to set their password. No creating admins via raw SQL.

**Schema additions:**
```prisma
enum AdminInviteStatus {
    PENDING
    ACCEPTED
    EXPIRED
    REVOKED
}

model AdminInvite {
    id          String            @id @default(uuid()) @db.Uuid
    email       String            @unique
    token       String            @unique  // hashed one-time token
    invitedBy   String            @db.Uuid
    inviter     Admin             @relation("AdminInviter", fields: [invitedBy], references: [id])
    roleId      String?           // Pre-assign a role on acceptance
    role        AdminRbacRole?    @relation(fields: [roleId], references: [id])
    status      AdminInviteStatus @default(PENDING)
    expiresAt   DateTime
    acceptedAt  DateTime?
    createdAt   DateTime          @default(now())

    @@index([token])
    @@index([status])
    @@map("admin_invites")
}
```

Add to `Admin` model: `sentInvites AdminInvite[] @relation("AdminInviter")`
Add to `AdminRbacRole` model: `invites AdminInvite[]`

**Backend:**
- `POST /admin/admins/invite` — super_admin only, sends invite email with token
- `POST /admin/admins/invite/accept` — public endpoint (no auth), validates token, sets password, creates Admin row + session
- `GET /admin/admins` — list all admins (for super_admin only)
- `DELETE /admin/admins/:id` — deactivate admin (sets `isActive: false`)
- `PATCH /admin/admins/:id/reactivate`

**Permissions:**
```
ADMINS: {
    VIEW: 'admins:view',
    MANAGE: 'admins:manage',
}
```
Only `super_admin` gets these.

**Migration name:** `add_admin_invites`

---

### TASK B8 — Skills & Certifications Catalog Management
**What it is:** Admin manages the pre-populated `Skill`, `SkillCategory`, `Certification`, `Institute`, `Role` (job role) master-data tables that job seekers pick from.

**Schema models:** All already exist — `Skill`, `SkillCategory`, `Certification`, `Institute`, `Role` (job roles).

**What to build:**

For each entity:
- Repository: `list`, `getById`, `create`, `update`, `delete`
- Controller endpoints:
  - `GET /admin/catalog/skills` — list with category filter
  - `POST /admin/catalog/skills`
  - `PATCH /admin/catalog/skills/:id`
  - `DELETE /admin/catalog/skills/:id`
  - Same pattern for `/catalog/skill-categories`, `/catalog/certifications`, `/catalog/institutes`, `/catalog/job-roles`

**Permissions:**
```
CATALOG: {
    VIEW: 'catalog:view',
    MANAGE: 'catalog:manage',
}
```

---

### TASK B9 — User Detail Enhancements (Missing actions)
Current users controller supports: list, view, suspend, unsuspend.

**Missing actions that need adding:**

1. **Delete user** — `DELETE /admin/users/:id` — hard-delete or set `status=DELETED`, audit log CRITICAL
2. **Reset user password** — `POST /admin/users/:id/reset-password` — generates a one-time reset token and emails it (or returns token for admin to share)
3. **Verify user email manually** — `PATCH /admin/users/:id/verify-email` — sets `isEmailVerified=true`, `emailVerifiedAt=now()`
4. **Unlock user** (after failed login lockout) — `PATCH /admin/users/:id/unlock` — clears `failedLoginAttempts`, `lockedUntil`, `lastFailedLoginAt`

**Add to `users.dto.ts`:** DTOs for each action.
**Add to `permissions.registry.ts`:** `users:delete`, `users:unlock` actions. `super_admin` gets delete. `platform_admin` gets unlock.

---

## Remaining Frontend Tasks (admin-ui)

### TASK F1 — Contact Form Page
Path: `admin-ui/app/(admin)/contact/page.tsx`

Table: incoming messages. Columns: Name, Email, Message (truncated), Status badge, Date, Action button.
Status actions: Mark as Reviewed / Resolved / Spam.
Detail modal (or `[id]` page): full message + status history + notes input.

**Depends on:** B1 backend.

---

### TASK F2 — Blog Management Page
Path: `admin-ui/app/(admin)/blog/page.tsx` + `admin-ui/app/(admin)/blog/[id]/page.tsx`

List with search + isPublished filter. Create/Edit form (same modal pattern as TestimonialForm). Rich content field (textarea is fine — no WYSIWYG needed yet).

**Depends on:** B2 backend.

---

### TASK F3 — Gallery Management Page
Path: `admin-ui/app/(admin)/gallery/page.tsx`

Grid of images. Upload form (just a URL input for now — file upload is a separate infra task). Toggle `isActive`. Delete.

**Depends on:** B3 backend.

---

### TASK F4 — Events Management Page
Path: `admin-ui/app/(admin)/events/page.tsx`

Table with title, date, location, published status. Create/Edit form. Publish/unpublish toggle.

**Depends on:** B4 backend.

---

### TASK F5 — Platform Settings Page
Path: `admin-ui/app/(admin)/settings/page.tsx`

Key-value toggle list. Each setting shows key, description, current value (rendered as toggle for booleans, text input for strings), and a Save button per row.

**Only visible to super_admin** — wrap entire page in `<RequirePermission action={ACTIONS.SETTINGS.MANAGE} />`.

**Depends on:** B5 backend + migration.

---

### TASK F6 — Content Reports Page
Path: `admin-ui/app/(admin)/reports/page.tsx`

Table: reporter, content type + ID, reason, status badge, date. Actions: Resolve (remove content) / Dismiss (false positive).

**Depends on:** B6 backend + migration.

---

### TASK F7 — Admin Management Page
Path: `admin-ui/app/(admin)/admins/page.tsx`

**Only visible to super_admin.**

Table: Name, Email, Role(s), Status (Active/Inactive), Last Login, Actions.
Actions: Invite new admin (form: email + pre-select role), Deactivate, Reactivate.

The invite form sends `POST /admin/admins/invite`. A public `/accept-invite?token=xxx` page (outside the admin layout) handles the accept flow.

**Depends on:** B7 backend + migration.

---

### TASK F8 — Skills & Catalog Management Pages
Paths:
- `admin-ui/app/(admin)/catalog/skills/page.tsx`
- `admin-ui/app/(admin)/catalog/certifications/page.tsx`
- `admin-ui/app/(admin)/catalog/institutes/page.tsx`
- `admin-ui/app/(admin)/catalog/job-roles/page.tsx`

Each: searchable table + inline create/edit form (modal pattern). Skill page also shows category filter.

**Depends on:** B8 backend.

---

### TASK F9 — Sidebar nav updates
File: `admin-ui/app/(admin)/layout.tsx`

Add nav items for: Contact, Blog, Gallery, Events, Settings, Reports, Admins, Catalog.
Each item must be conditionally rendered based on permissions — use `usePermissions()` hook's `has()` method.

Example for Settings (super_admin only):
```tsx
{has(ACTIONS.SETTINGS.MANAGE) && (
  <NavItem href="/settings" label="Settings" icon={Settings2} />
)}
```

---

## Migrations Required

| Task | Migration name | What it adds |
|---|---|---|
| B5 | `add_platform_settings` | `PlatformSetting` model |
| B6 | `add_content_reports` | `ContentReport` model + enums, relation on `User` |
| B7 | `add_admin_invites` | `AdminInvite` model + enum, relations on `Admin` + `AdminRbacRole` |

**How to create a migration:**
```bash
cd cykruit-app
npx prisma migrate dev --name add_platform_settings
```
Never use `prisma db push` — see `docs/CONTEXT.md` for why.

---

## Permissions Registry — Full Updated Version

After all backend tasks are done, `permissions.registry.ts` should have these additions:

```typescript
CONTACT: {
    VIEW: 'contact:view',
    MANAGE: 'contact:manage',
},
BLOG: {
    VIEW: 'blog:view',
    MANAGE: 'blog:manage',
},
GALLERY: {
    MANAGE: 'gallery:manage',
},
EVENTS: {
    VIEW: 'events:view',
    MANAGE: 'events:manage',
},
SETTINGS: {
    VIEW: 'settings:view',
    MANAGE: 'settings:manage',
},
REPORTS: {
    VIEW: 'reports:view',
    MANAGE: 'reports:manage',
},
ADMINS: {
    VIEW: 'admins:view',
    MANAGE: 'admins:manage',
},
CATALOG: {
    VIEW: 'catalog:view',
    MANAGE: 'catalog:manage',
},
```

**Updated system role grants:**

| Role | Gets |
|---|---|
| `super_admin` | ALL (unchanged — bypass anyway) |
| `platform_admin` | Everything EXCEPT `rbac:manage`, `settings:manage`, `admins:view`, `admins:manage` |
| `reviewer` | `dashboard:view`, `users:view`, `kyc:view`, `kyc:review`, `jobs:view`, `jobs:review`, `reports:view` |

After updating the registry, run `npm run rbac:seed` inside `admin-app/` to sync to DB.

---

## Work Order (Priority)

| Priority | Task | Depends on |
|---|---|---|
| 🔴 High | B7 + F7 — Admin invite flow | Migration needed |
| 🔴 High | Run `npm run rbac:seed` | Nothing, just do it |
| 🟡 Medium | B9 — User detail enhancements | Nothing |
| 🟡 Medium | B1 + F1 — Contact form | Nothing (schema exists) |
| 🟡 Medium | B5 + F5 — Platform settings | Migration needed |
| 🟡 Medium | B6 + F6 — Content reports | Migration needed |
| 🟢 Lower | B2 + F2 — Blog | Nothing (schema exists) |
| 🟢 Lower | B3 + F3 — Gallery | Nothing (schema exists) |
| 🟢 Lower | B4 + F4 — Events | Nothing (schema exists) |
| 🟢 Lower | B8 + F8 — Catalog management | Nothing (schema exists) |
| 🟢 Lower | F9 — Sidebar nav updates | All F tasks |

---

## Rules for the Developer

1. **Every mutation endpoint must write an `AdminAuditLog` entry.** Read `docs/AUDIT_LOGGING.md` before writing any service method. Use `AdminAuditLogger` — do not write to the table directly.

2. **Every admin controller must use `@UseGuards(AdminAuthGuard, PermissionsGuard)`.** Never skip the guards.

3. **Never use `include` in Prisma queries — always use `select`.** Raw Prisma objects must never reach the HTTP response.

4. **DTOs use `class-validator` decorators and `@ApiProperty()`.** No bare `string` or unvalidated fields.

5. **Never use `any`.** Use `unknown` if type is unclear.

6. **Multi-step writes use `prisma.$transaction()`.** No partial writes.

7. **New permissions must be added to `permissions.registry.ts` first**, then wired in controllers via `@RequirePermission()`, then re-seeded via `npm run rbac:seed`.

8. **Migrations follow the baseline convention.** Run `prisma migrate dev --name <name>` inside `cykruit-app/`. Never `db push`. Never reset. See `docs/CONTEXT.md`.
