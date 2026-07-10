# Security Audit — Cykruit

> Audit #1 date: 2026-07-07 — 33 confirmed · 27 fixed · 6 deferred  
> Audit #2 date: 2026-07-09 — 47 confirmed · 47 fixed / deferred (see below)  
> Method: 61-agent parallel scan (7 dimensions)  
> Combined status: ~42 fixed in code · ~11 deferred

---

## Fixed

### Authentication & Session

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| auth-1 | HIGH | CSRF protection disabled on employer, seeker, notification services | Enabled `enableCsrf: true` in all 4 modules |
| auth-3 | MEDIUM | CSRF secret derived from same key as JWT — rotation of one breaks the other | `CSRF_SECRET` env var now independent; falls back to `JWT_SECRET` |
| auth-4 | MEDIUM | No rate limit on `POST /auth/reset-password` | `@RateLimit({ reset_password: { ttl: 15min, limit: 10 } })` added |
| auth-5 | MEDIUM | No rate limit on `GET /auth/check-verification` | `@RateLimit({ check_verification: { ttl: 1min, limit: 20 } })` added |
| auth-6 | LOW | Auth logs contain PII — user email logged in 5 places in auth.service | Replaced with `uid=<id>` |
| auth-7 | LOW | IP extraction in AuthGuard ignores `TRUSTED_PROXY_COUNT` — rate limit bypass possible behind proxy | `extractIp()` now reads `TRUSTED_PROXY_COUNT` env var |

### API & Input Validation

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| api-1 | HIGH | IDOR on application endpoints — employer can access another employer's applications by guessing IDs | `jobId` ownership check added; `ParseUUIDPipe` on both params |
| api-3 | MEDIUM | Office location `address` field unbounded — no max length | `@MaxLength(500)` on address, `@MaxLength(100)` on city/state/country |
| api-4 | MEDIUM | Job search `sortBy` accepts arbitrary strings — potential injection vector | Replaced `@IsString()` with `@IsIn(['recent', 'relevance'])` |
| api-6 | MEDIUM | Public job search endpoints unauthenticated with no rate limit — open to scraping | `@RateLimit({ public_search: { ttl: 1min, limit: 60 } })` on `getJobs()` and `getJobBySlug()` |
| api-7 | LOW | Request body limits set to 10 MB on all services — DoS vector | auth/seeker/public: `64kb`; employer: `512kb` |

### Frontend / UI

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| fe-2 | HIGH | Missing `x-csrf-token` header on state-mutating fetches in 6 UI pages | Added CSRF token to: employer notifications, seeker notifications, saved jobs, job detail save/unsave, employer messages, seeker messages |
| fe-3 | MEDIUM | No `X-Frame-Options` / CSP `frame-ancestors` — clickjacking possible | `X-Frame-Options: DENY`, `frame-ancestors 'none'` added in `next.config.ts` |
| fe-4 | LOW | No `X-Content-Type-Options` header | `nosniff` added |
| fe-5 | LOW | No `Referrer-Policy` header | `strict-origin-when-cross-origin` added |

### Admin / Backend

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| admin-1 | HIGH | Subscription proxy URLs all wrong — missing `/subscriptions` prefix (8 routes broken) | Fixed all 8 URLs in `admin/services/subscription.service.ts` |
| admin-2 | MEDIUM | Gateway health endpoint leaks all internal service URLs in production | Health response hides service map when `NODE_ENV=production` |

### Rate Limiters (throttle config)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| rl-1 | MEDIUM | `reset_password` throttler not registered in `RateLimitModule` | Added to throttlers array |
| rl-2 | MEDIUM | `check_verification` throttler not registered | Added |
| rl-3 | MEDIUM | `public_search` throttler not registered | Added |

---

## Deferred — Needs Infra / External Action

> These are confirmed real. Do not re-audit. Fix when working on infra, Docker, or adding npm packages.

| ID | Severity | Finding | What's Needed |
|----|----------|---------|---------------|
| auth-2 | CRITICAL | Production secrets in plaintext `.env` — AWS IAM key, Resend key, Google OAuth secret, Gemini key, weak `JWT_SECRET` passphrase | AWS Secrets Manager / Vault; `openssl rand -hex 32` for JWT_SECRET |
| ws-3 | HIGH | No per-socket WS rate limiting — authenticated user can flood `join:conversation` | Redis per-socket counter in a WS interceptor |
| ws-4 | HIGH | WS JWT has no revocation — stays live for full TCP connection lifetime after session revoke | DB/Redis jti blocklist or short-TTL hashed token store |
| data-2 | MEDIUM | File validators trust client-supplied MIME type — no magic byte check | `npm install file-type` in employer-service and seeker-profile-service |
| api-2 / auth-8 | MEDIUM | All microservices bind `0.0.0.0` — exposed on all interfaces inside Docker | Set `HOST=127.0.0.1` default in docker-compose; add firewall rules |
| api-5 | LOW | `TRUSTED_PROXY_COUNT=0` in `.env` — rate limit IP tracking collapses to proxy IP in production | Set `TRUSTED_PROXY_COUNT=1` in production `.env` |

---

## False Positives

| ID | Finding | Why False |
|----|---------|-----------|
| fe-1 | `proxy.ts` flagged as dead code | Next.js 16 renamed `middleware.ts` → `proxy.ts`; `export function proxy()` is the correct convention (confirmed via `node_modules/next/dist/docs/`) |

---

## Audit #2 — Findings (2026-07-09)

### Authentication (auth-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| auth-8 | HIGH | Suspended/deleted accounts bypass session validation — `validateSession()` never checked `user.status` | Fixed: status guard in `session.service.ts` |
| auth-9 | HIGH | OAuth email-match path skips account status checks | Fixed: status guards mirrored into `oauth-base.service.ts` email-match branch |
| auth-10 | MEDIUM | Cancel-deletion token stored as plaintext in DB | Fixed: `hashToken(cancelToken)` before storing |
| auth-11 | MEDIUM | No per-email OTP rate limit — brute-forceable | Fixed: Redis `INCR`+`EXPIRE` sliding window (5 req / 10 min per email) in `otp.service.ts` |

### Authorization (authz-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| authz-1 | HIGH | HIRING_MANAGER can invite another HIRING_MANAGER — privilege escalation | Fixed: role-cap guard in `team.service.ts` `inviteMember` |
| authz-2 | HIGH | Public profile endpoint leaks team member emails | Fixed: removed `email` from `teamMembers` mapping in `profiles.service.ts` |
| authz-3 | MEDIUM | Non-deterministic `findFirst` on employer membership — race condition | Fixed: `orderBy: { createdAt: 'asc' }` in `permissions.service.ts` and `company.repository.ts` |
| authz-4 | MEDIUM | SEEKER role can accept employer team invites | Fixed: `UserRole.EMPLOYER` guard in `team.service.ts` `acceptInvite` |
| authz-5 | MEDIUM | Message deletion without conversation scope — cross-conversation delete possible | Fixed: `conversationId` added to `deleteMessage` WHERE clause |
| authz-6 | MEDIUM | `jobs:read` not in permission sets — VIEWER couldn't read jobs | Fixed: added `jobs:read` to `EMPLOYER_ONLY_ACTIONS` and `ALL_MEMBER_ACTIONS`; `@RequirePermission` on list/getOne |
| authz-7 | LOW | `getTeam()` missing permission guard | Fixed: `@RequirePermission(ACTIONS.COMPANY.READ)` added |

### Subscription enforcement (sub-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| sub-1 | HIGH | Expired/cancelled subscriptions still grant job posting limits | Fixed: status+expiry check in `getMaxActiveJobs` and `resolveMaxTeamMembers` |
| sub-2 | HIGH | Admin `PATCH :id/status` accepts arbitrary strings — could set `status: "HACKED"` | Fixed: `UpdateSubscriptionStatusDto` with `@IsIn(['ACTIVE','EXPIRED','CANCELLED'])` |
| sub-3 | MEDIUM | Already-ACTIVE subscription can be re-activated — quota reset abuse | Fixed: guard in `subscription.repository.ts` `updateSubscriptionStatus` |
| sub-4 | MEDIUM | No payment model — subscription assignment has no payment gate | Deferred: no payment integration exists yet |
| sub-5 | MEDIUM | No audit logging on subscription assign/status change | Fixed: `AdminAuditLogger.log` in `subscription.service.ts` |
| sub-6 | LOW | `DEFAULT_MAX_ACTIVE_JOBS = 5` — should be 3 to match free tier | Fixed: constant lowered to `3` |

### Input validation (input-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| input-1 | HIGH | `screeningQuestions` DTO field typed as `any` | Fixed: `ScreeningQuestionDto` class with full type guards in `job.dto.ts` |
| input-2 | MEDIUM | No MaxLength on seeker basic info strings | Fixed: `@MaxLength` on all string fields in `update-basic-info.dto.ts` |
| input-3 | MEDIUM | Contact form `fullName`/`message` unbounded | Fixed: `@MaxLength(100)` / `@MaxLength(5000)` in `create-contact.dto.ts` |
| input-4 | MEDIUM | Application note `@MaxLength` missing | Fixed: `@MaxLength(2000)` in `application.dto.ts` |
| input-5 | MEDIUM | `seeker-profile-service` body limit 10 MB | Fixed: lowered to `512kb` in `main.ts` |
| input-7 | MEDIUM | `skillId`/`certificationId` DTOs accept arbitrary strings | Fixed: `@IsUUID()` in `add-skill.dto.ts` and `add-certification.dto.ts` |
| input-8 | MEDIUM | `ScreeningAnswerDto.questionId` not validated as UUID | Fixed: `@IsUUID()` + `@ArrayMaxSize(20)` in `apply-job.dto.ts` |
| input-9 | LOW | Admin search `q` and `reason` fields unbounded | Fixed: `@MaxLength(200)` on `q`, `@MaxLength(1000)` on `reason` in `users.dto.ts` and `testimonials.dto.ts` |
| input-10 | LOW | Invite `token` and messaging `targetUserId`/`jobId` not UUID-validated | Fixed: `@MaxLength(500)` on token; `@IsUUID()` on IDs |

### Seeker-specific (seeker-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| seeker-3 | HIGH | Seekers can start conversations with other seekers | Fixed: `targetUser.role === EMPLOYER` check in `messaging.service.ts` |
| seeker-4 | MEDIUM | Public profile endpoint rate-unlimited, UUID not validated | Fixed: `@RateLimit` + `ParseUUIDPipe` in `profiles.controller.ts` |
| seeker-5 | MEDIUM | SHORTLISTED applications can be withdrawn | Fixed: `SHORTLISTED` added to `NON_WITHDRAWABLE_STATUSES` |
| seeker-6 | LOW | File upload filenames not sanitized | Fixed: regex sanitize + 255-char limit in `upload.service.ts` |
| seeker-1 | LOW | File validators trust client MIME type | Fixed: `validateMagicBytes()` in `upload.service.ts` — checks first 4 bytes against PDF/JPEG/PNG/GIF/WebP/DOCX signatures |

### Infrastructure (infra-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| infra-2 | HIGH | `POSTGRES_PASSWORD: rana` hardcoded in docker-compose.yml (10 places) | Fixed: replaced with `${POSTGRES_PASSWORD}` env var; `.env.example` created at root |
| infra-3 | HIGH | Redis has no auth — no `--requirepass` in docker-compose | Fixed: `--requirepass ${REDIS_PASSWORD}` added; `REDIS_PASSWORD` propagated to all services |
| infra-4 | MEDIUM | CORS wildcard `*` allowed via `allowedOrigins.includes("*")` fallback | Fixed: removed wildcard fallback in `user-settings-service/main.ts` |
| infra-6 | MEDIUM | npm audit vulnerabilities in dependencies | Deferred: run `npm audit fix` in `cykruit-app/` and `admin-app/` |
| infra-8 | MEDIUM | CSP `connect-src` allows all `ws:` and `wss:` origins | Fixed: restricted to `NEXT_PUBLIC_WS_URL` (defaults to `ws://127.0.0.1:4007`) |
| infra-9 | MEDIUM | `sameSite: "none"` in non-HTTPS cookie config — CSRF exposure | Fixed: all cookies now `sameSite: "strict"` unconditionally |
| infra-10 | LOW | Missing `Cross-Origin-Opener-Policy` and `Permissions-Policy` headers | Fixed: `COOP: same-origin`, `Permissions-Policy: camera=(),mic=(),geo=(),payment=()` in `next.config.ts` |
| infra-11 | LOW | `notification-service`, `subscription-service`, `user-settings-service` body limits 10 MB | Fixed: lowered to `256kb` |
| infra-1 | LOW | CSP unsafe-inline/unsafe-eval | Deferred: requires nonce-based CSP refactor |

### Frontend (fe-*)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| fe-6 | MEDIUM | CSP `unsafe-inline`/`unsafe-eval` in script-src | Deferred: nonce-based CSP refactor required |
| fe-7 | MEDIUM | KYC draft stored in `localStorage` — persists across sessions | Fixed: changed to `sessionStorage` in `kyc/employer/page.tsx` |
| fe-8 | MEDIUM | CTF profile `profileUrl` used as `<a href>` without protocol validation | Fixed: `/^https?:\/\//` guard in `u/[username]/page.tsx` |
| fe-9 | MEDIUM | Notification `actionUrl` used as `<Link href>` without origin validation | Fixed: relative-path-only check (`/^\//.test(...)`) in employer + seeker notifications pages |
| fe-11 | MEDIUM | Employer layout auth check is client-side only | Fixed: async server component in `(employer)/layout.tsx` — fetches `/auth/me` server-side, redirects if not EMPLOYER |
| fe-12 | LOW | `console.error` in 9 catch blocks leaks stack traces in production | Fixed: gated behind `process.env.NODE_ENV === 'development'` |
