# Security Audit — Cykruit

> Audit date: 2026-07-07  
> Method: 67-agent parallel scan  
> Total findings: 33 confirmed  
> Status: 27 fixed in code · 6 deferred (infra/external deps)

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
