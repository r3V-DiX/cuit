# Audit Logging — Implementation Guide

| | |
|---|---|
| **Scope** | `cykruit-app` (all microservices) + `admin-app` + `admin-ui` |
| **Audience** | Claude (future sessions) and human developers — read this before adding any new mutation endpoint anywhere in the platform |
| **Status** | Active — Phase A (schema + admin-ui 3-tab UI) and Phase B (cykruit-app instrumentation) complete as of July 2026 |
| **Related** | `docs/CONTEXT.md` (decisions log — has a short pointer back to this file) |

## Why this file exists

admin-ui's Audit Logs page has three tabs. Each is backed by a different table with a different writer and a different actor type. Getting the wrong one wrong doesn't fail loudly — it either silently writes nothing useful, or fails a foreign-key constraint at write time. This guide exists so that adding audit logging to a new mutation is a 5-minute mechanical task instead of a rediscovery exercise. **If you are adding a POST/PATCH/PUT/DELETE endpoint anywhere in this platform, read the "Decision" and "Recipe" sections below before writing the endpoint, not after.**

---

## 1. The mental model

There are **four** tables, feeding **three** admin-ui tabs:

```
                    ┌─────────────────────┐
Tab 1: Audit Logs   │  AuthAuditLog        │  main app: login/logout/OTP/register/account events
(unified auth,      │  (auth_audit_logs)   │  actor: User (nullable)
merged by SQL       ├─────────────────────┤
UNION ALL)          │  AdminAuthAuditLog   │  admin console: login/logout only
                     │ (admin_auth_audit_  │  actor: Admin (nullable)
                     │  logs)               │
                     └─────────────────────┘

Tab 2: System Logs  ┌─────────────────────┐
                     │  AuditLog            │  main app: business mutations (jobs, KYC, applications,
                     │  (audit_logs)        │  team, company, profile, settings, subscriptions)
                     └─────────────────────┘  actor: User (HARD FK — see §2)

Tab 3: Admin        ┌─────────────────────┐
Activity Logs        │  AdminAuditLog       │  admin console: business mutations (kyc:approve,
                     │  (admin_audit_logs)  │  jobs:review, users:suspend, rbac:manage, etc.)
                     └─────────────────────┘  actor: Admin (HARD FK — see §2)
```

The split is **not** "main app vs admin app" — it's **auth events vs business events vs who performed them**. A login is always Tab 1 regardless of who logs in. A KYC document being uploaded by an employer is Tab 2. A KYC document being approved by console staff is Tab 3.

## 2. The rule that decides everything: the actor FK

This is the one fact that prevents 90% of mistakes:

- **`AuditLog.actorId`** is a **hard foreign key to `User`**. It cannot hold an `Admin.id`. If you try, the write fails (or, if you fudge the type, silently violates referential integrity).
- **`AdminAuditLog.adminId`** is a **hard foreign key to `Admin`**. It cannot hold a `User.id`.
- **`AuthAuditLog.userId`** and **`AdminAuthAuditLog.adminId`** are both nullable (failed logins for unknown identities have no resolvable actor yet).

**Before wiring anything, ask: who performed this action — a platform `User` (seeker/employer) or console `Admin`?**

- Platform `User` performed a business action → `AuditLog` (Tab 2 / System Logs)
- Console `Admin` performed a business action → `AdminAuditLog` (Tab 3 / Admin Activity Logs)
- Either performed a login/logout/auth event → `AuthAuditLog` or `AdminAuthAuditLog` (Tab 1 / Audit Logs)

**Known exception**: `subscription-service`'s admin endpoints (`AdminPackagesController`, `AdminSubscriptionController`) are guarded by that service's own `AdminGuard`, which checks `User.role === 'ADMIN'` — a **legacy** actor model, not the new `Admin` model used everywhere else. Those mutations legitimately have a `User` actor and correctly write to `AuditLog`, not `AdminAuditLog`. Don't assume every "admin-flavored" endpoint in `cykruit-app` needs `AdminAuditLog` — check which guard/actor model it actually uses (`grep`/read the guard, don't assume from the name).

## 3. Full schema reference

### `AuditLog` (`audit_logs`) — System Logs

```prisma
model AuditLog {
    id         String   @id @default(uuid())
    actorId    String                          // FK -> User.id (hard, NOT NULL)
    actorRole  String   @default("ADMIN")       // ALWAYS pass explicitly — the default is wrong for this use
    action     String                           // "<module>:<verb>", e.g. "jobs:create"
    module     String                           // "JOBS" | "KYC" | "APPLICATIONS" | "TEAM" | "COMPANY" | "PROFILE" | "SETTINGS" | "SUBSCRIPTIONS"
    targetType String?                          // "Job" | "EmployerVerification" | "Application" | ...
    targetId   String?
    oldData    Json?
    newData    Json?
    riskLevel  String   @default("LOW")         // LOW | MEDIUM | HIGH | CRITICAL
    result     String                           // SUCCESS | FAILURE | DENIED
    reason     String?
    ipAddress  String?
    metadata   Json?
    createdAt  DateTime @default(now())
}
```

### `AdminAuditLog` (`admin_audit_logs`) — Admin Activity Logs

```prisma
model AdminAuditLog {
    id         String @id @default(uuid())
    adminId    String @db.Uuid                 // FK -> Admin.id (hard, NOT NULL)
    action     String                          // registry action, e.g. "kyc:review"
    module     String @default("")
    resource   String?                         // "EmployerVerification" | "Job" | "User" | ...
    resourceId String?
    riskLevel  String @default("LOW")
    result     String @default("SUCCESS")      // SUCCESS | FAILURE | DENIED
    reason     String?
    ipAddress  String?
    userAgent  String?
    oldData    Json?
    newData    Json?
    metadata   Json?
    createdAt  DateTime @default(now())
}
```

### `AuthAuditLog` (`auth_audit_logs`) — Audit Logs tab, main-app half

```prisma
model AuthAuditLog {
    id        String   @id @default(uuid())
    action    String                           // AuditAction enum, e.g. LOGIN_SUCCESS
    status    String                           // SUCCESS | FAILURE
    userId    String?                          // nullable — unknown-email failed logins
    ipAddress String?
    userAgent String?
    sessionId String?
    metadata  Json?
    createdAt DateTime @default(now())
}
```

### `AdminAuthAuditLog` (`admin_auth_audit_logs`) — Audit Logs tab, admin-console half

```prisma
model AdminAuthAuditLog {
    id        String   @id @default(uuid())
    action    String                           // ADMIN_LOGIN_SUCCESS | ADMIN_LOGIN_FAILURE | ADMIN_LOGOUT
    status    String                           // SUCCESS | FAILURE
    adminId   String?  @db.Uuid                // nullable — unknown-email failed logins
    ipAddress String?
    userAgent String?
    metadata  Json?
    createdAt DateTime @default(now())
}
```

---

## 4. Recipe: adding audit logging to a new `cykruit-app` mutation (→ `AuditLog` / System Logs)

Follow these steps in order. Every step references the real, already-working example from `apps/employer-service/src/employer/services/jobs.service.ts` — read that file if any step is unclear.

**Step 1 — Check if the owning module already imports `AuditModule`.**
Open `apps/<service>/src/<feature>/<feature>.module.ts` and look for `import { AuditModule } from '@cykruit/audit';` in the imports array.

Already wired (as of July 2026): `employer-service` (`employer.module.ts`), `seeker-service` (`seeker.module.ts`), `auth-service` (`auth.module.ts`), `seeker-profile-service` (`profile.module.ts`), `user-settings-service` (`settings.module.ts`), `subscription-service` (`subscription.module.ts`).

If your service isn't in that list (new service, or one not yet touched), add it:
```ts
import { AuditModule } from '@cykruit/audit';
// ...
@Module({
  imports: [
    // ...existing imports
    AuditModule,
  ],
})
```

**Step 2 — Check the service's `tsconfig.build.json` for a stale `paths` override.**
Some per-service `tsconfig.build.json` files override `compilerOptions.paths` entirely instead of inheriting from root `tsconfig.json` (TypeScript **replaces**, never merges, `paths`). If yours has a `paths` block, it **must** include:
```json
"@cykruit/audit": ["libs/audit/src/index.ts"]
```
Compare against `apps/employer-service/tsconfig.build.json` (has it) if unsure. Missing this produces `Cannot find module '@cykruit/audit'` at `ts-node-dev`/build time even though `tsc --noEmit` against the root project may pass — don't be misled by a clean top-level typecheck into skipping this check. (Hit and fixed for `subscription-service` in July 2026 — see `docs/CONTEXT.md`.)

**Step 3 — Inject `AuditService` into the service class.**
```ts
import { AuditService } from '@cykruit/audit';

@Injectable()
export class YourService {
  constructor(
    // ...existing deps
    private readonly auditService: AuditService,
  ) {}
}
```

**Step 4 — Call `logAction()` immediately after the mutation succeeds.**
```ts
this.auditService.logAction({
  actorId: userId,                 // the User.id who performed the action
  actorRole: 'EMPLOYER',           // 'SEEKER' | 'EMPLOYER' | 'ADMIN' — pass explicitly, never rely on the schema default
  action: 'jobs:update',           // '<module>:<verb>' convention, lowercase verb, snake_case if multi-word
  module: 'JOBS',                  // SCREAMING_SNAKE, matches the FilterBar options in admin-ui's audit-logs page
  targetType: 'Job',               // the Prisma model name being affected
  targetId: job.id,
  oldData: { status: before.status },   // optional — omit if there's nothing meaningful to diff
  newData: { status: updated.status },  // optional
  result: 'SUCCESS',               // 'SUCCESS' | 'FAILURE' | 'DENIED'
  riskLevel: 'MEDIUM',             // optional, defaults to 'LOW' — bump for deletes, role/ownership changes, transfers
  reason: dto.reason,              // optional — free text, e.g. a rejection/close reason
  ipAddress,                       // optional — thread through from the controller, see Step 5
  metadata: { userAgent },         // optional — anything else worth keeping; userAgent conventionally lives here
});
```
`logAction()` is **fire-and-forget and never throws** — call it unconditionally after the write, no `try/catch` needed, no `await` needed (though awaiting is harmless if you want ordering guarantees in a test).

**Step 5 — Thread `ipAddress`/`userAgent` from the controller (for higher-risk actions).**
In the controller:
```ts
import { Req } from '@nestjs/common';
import type { Request } from 'express';

@Patch(':id')
update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateDto, @Req() req: Request) {
  return this.service.update(user.id, id, dto, req.ip, req.headers['user-agent']);
}
```
This is a judgment call, not a hard requirement — every mutation in `employer-service` (KYC, Jobs, Team, core Company edits) threads it; the lower-stakes ones in `seeker-profile-service` and `user-settings-service` skip it to keep the diff small (see §6 for the full "what got full vs partial treatment" list). When in doubt, thread it — it's cheap and valuable for incident investigation.

**Step 6 — Check for a domain-event dedup risk.**
If the same mutation also calls `EventPublisher.publish(DomainEventType.X, ...)` (for user-facing notifications), do **not** treat that as your audit trail — the event payloads mostly lack the actor's ID (`TEAM_INVITE_SENT`, `APPLICATION_STATUS_CHANGED` only carry the *target*, not who acted) and several event types are admin/cron-initiated (`JOB_APPROVED`, `KYC_APPROVED`, `ACCOUNT_SUSPENDED`, `SUBSCRIPTION_EXPIRED`) so can't legally write to `AuditLog` anyway (see §2). Always add the direct `logAction()` call regardless of whether an event is also published — they serve different consumers (notifications vs audit trail) and are not redundant with each other.

---

## 5. Recipe: adding audit logging to a new `admin-app` mutation (→ `AdminAuditLog` / Admin Activity Logs)

`admin-app` already has this fully wired for every existing mutation. For a new one:

1. Inject `AdminAuditLogger` from `admin-app/src/admin/services/admin-audit.logger.ts` into your service.
2. After the mutation succeeds, call:
```ts
this.adminAuditLogger.log({
  adminId: currentAdmin.id,        // from @CurrentAdmin()
  action: 'kyc:approve',           // registry action string
  module: 'kyc',
  resource: 'EmployerVerification',
  resourceId: verification.id,
  oldData: {...},                  // optional
  newData: {...},                  // optional
  riskLevel: 'MEDIUM',             // optional, defaults 'LOW'
  result: 'SUCCESS',
  reason: dto.adminNotes,          // optional
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```
3. `.log()` is fire-and-forget/never-throws, same contract as `AuditService.logAction()`.

For a new **admin login/logout/auth event**, use `AdminAuthAuditLogger` (`admin-app/src/admin/services/admin-auth-audit.logger.ts`) instead — same shape, writes `AdminAuthAuditLog`. See `admin-app/src/admin/auth/admin-auth.service.ts` for the live example (login success/failure, logout).

---

## 6. Reference map — where this is already wired (July 2026)

| Service | File | Actions instrumented |
|---|---|---|
| `employer-service` | `services/kyc.service.ts` | submit, resubmit |
| `employer-service` | `services/jobs.service.ts` | create, update, submit, close, delete, reopen |
| `employer-service` | `services/company.service.ts` | setup, update basic/about/social, upload logo/banner, add/remove location, add/remove benefit |
| `employer-service` | `services/team.service.ts` | invite, change role, remove member, transfer ownership |
| `employer-service` | `services/applications.service.ts` | update status |
| `seeker-service` | `services/applications.service.ts` | apply, withdraw |
| `seeker-profile-service` | `services/profile.service.ts` | update basic info, upload/delete profile image |
| `seeker-profile-service` | `services/resume.service.ts` | upload, replace, delete |
| `user-settings-service` | `services/seeker-settings.service.ts` | update general settings |
| `user-settings-service` | `services/employer-settings.service.ts` | update general settings |
| `subscription-service` | `services/packages.service.ts` | create, update, delete package |
| `subscription-service` | `services/subscription.service.ts` | assign, update status |
| `admin-app` | every controller under `src/admin/controllers/` | all mutations, via `AdminAuditLogger` (pre-existing, unchanged by this work) |
| `admin-app` | `auth/admin-auth.service.ts` | login success/failure, logout, via `AdminAuthAuditLogger` |
| `auth-service` | `services/auth.service.ts`, `services/otp.service.ts` | login, logout, register, OTP, account deactivate/delete/cancel-deletion — via `AuditService.log()` → `AuthAuditLog` (pre-existing, this is the Tab 1 main-app source) |

## 7. Deliberately NOT instrumented (revisit if priorities change)

| What | Why |
|---|---|
| `seeker-service` saved-jobs (bookmark toggle) | Low signal — a bookmark isn't an incident-relevant action |
| `seeker-profile-service` experience/education/skills/certifications/projects/CTF profiles | Self-service content curation, near-zero incident-investigation value; `profile` (identity) and `resume` (PII document) were treated as the representative high-signal subset of this domain |
| `user-settings-service` notification-toggle changes, location-preference CRUD | Low signal compared to visibility/search-status settings, which *are* instrumented |
| `notification-service` (`NotificationModule`, `MessagingModule`) | Product activity (chat messages, notification delivery), not security/moderation relevant |
| `auth-service` account events duplicated into `AuditLog` | Already fully captured by `AuthAuditLog` (Tab 1) — duplicating into Tab 2 would just create confusing double-entries for the same action |

If you decide any of these need instrumenting after all, follow the §4 recipe — nothing structural is missing, it's a scope call, not a technical gap.

## 8. Verification checklist (run this before considering audit logging "done" for a new mutation)

1. **Module wiring**: does the owning `*.module.ts` import `AuditModule`? Does the constructor injection resolve (the service boots without a DI error)?
2. **tsconfig**: if the service has a per-service `tsconfig.build.json` with a `paths` override, does it list `@cykruit/audit`?
3. **Typecheck**: `npx tsc --noEmit` from the `cykruit-app` root — should be clean (ignore pre-existing unrelated errors in files you didn't touch; if unsure whether an error is pre-existing, `git diff` the flagged file to check whether your change touched that line).
4. **Boot check**: start the service (`npm run start:<service>:dev` from `cykruit-app` root, **not** the app subfolder — there is no per-app `start:dev` script) and confirm no compile/DI errors in the log.
5. **Write-path check** (fastest way to validate field shapes without fighting session/CSRF plumbing in a test harness): a one-off Node script using `@prisma/client` directly against the same field shape your `logAction()` call uses — see the pattern used in this session (`node -e "... prisma.auditLog.create({...})"`). Clean up the test row afterward.
6. **Read-path check**: confirm the row surfaces correctly through `GET /admin/audit-logs/system` (or `/admin-activity` for `AdminAuditLog`) on a running `admin-app`, including the joined `actor`/`admin` relation.
7. Clean up any test sessions/rows created during verification — don't leave scratch data in the shared dev DB.
