# Session Memory

## 2026-07-12 — cykruit-ui admin panel + TS fixes

- **Mistake:** `interface PaginationMeta` and `interface DashboardStats` defined without `export` in auth-service admin services. TS4053 fired because controller return types referenced them. Fix: always `export` interfaces that are used as return types of public controller methods.
- **Fix:** `Fragment` with explicit `key` required when mapping to multiple sibling `<tr>` elements (expandable rows). `<>` short-form cannot hold a `key`. Applied to `auth/page.tsx`, `system/page.tsx`, `admin-activity/page.tsx` log pages.
- **Fix:** `apiFetch` was redirecting to `/login` on `403` for admin routes. Wrong — `403` = forbidden (permission error), should surface as toast. Only `401` = unauthenticated, should redirect. Updated to `response.status === 401` unconditionally.
- **Convention:** cykruit-ui admin list endpoints expect `{ items, pagination }` response shape. Audit log endpoints expect `{ items, meta }`. Do not mix.
- **Dead proxy route removed:** `ADMIN_URL` pointing to non-existent port 4010 replaced with 6 specific rewrites to correct services. Never use a catch-all proxy rewrite that points to a port with no service.

## 2026-07-10 — admin-app CORS debugging

- **Mistake:** Assumed the stray `CORS_ORIGIN` value came from a leftover shell
  environment variable and asked the user to restart their terminal. Wrong —
  the value was injected on every boot by the generated Prisma client.
- **Correct approach:** The generated Prisma client auto-loads the `.env`
  sitting next to its `schema.prisma` (`schemaEnvPath` in
  `node_modules/.prisma/client/index.js`) at import time. Because `admin-app`
  maps `@prisma/client` to `cykruit-app/node_modules/@prisma/client`
  (see `admin-app/tsconfig-paths-bootstrap.js`), importing it loads
  `cykruit-app/.env` **before** `ConfigModule.forRoot()` runs, and env loaders
  never overwrite already-set keys — so `cykruit-app/.env` silently wins over
  `admin-app/.env` for any colliding key (`CORS_ORIGIN`, `JWT_SECRET`, ...).
- **Fix pattern:** `import 'dotenv/config';` must stay the **first** import in
  `admin-app/src/main.ts` so `admin-app/.env` is loaded before the Prisma
  client can inject `cykruit-app/.env`. Applies to any future entry point in
  `admin-app` (workers, seed scripts run without the bootstrap, etc.).
- **Also:** `.env` files do not support `—`-style inline comments without `#`.
  `cykruit-app/.env` had bare `— used in ...` suffixes on
  `REDIS_THROTTLER_DB`, `CORS_ORIGIN`, `BCRYPT_ROUNDS`; the comment text was
  parsed into the values. Always prefix inline comments with `#`.
- **Mistake:** Declared `admin-app/src/admin/guards/admin.guard.ts` "dead code,
  not imported anywhere" after only checking `admin.module.ts`. It was imported
  by `TestimonialsController`. Before calling a file dead, check its actual
  importers (deleting it and letting the build fail found the consumer — but
  the claim should not have been made first).
- **Debugging note:** `console.log` output at bootstrap time in `admin-app`
  can be swallowed (buffered logs / custom logger); writing a temp file was
  the reliable way to inspect `process.env` at runtime.
