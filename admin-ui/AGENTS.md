# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Admin UI specifics

- This app is the admin console (port 3100). Its product/tech specs live in `../docs/admin-ui/` — follow them.
- Mirror `../cykruit-ui` conventions exactly (Tailwind v4 CSS-first theme, hand-rolled `components/ui/`, native fetch, `proxy.ts` not `middleware.ts`).
- All `/api/admin/*` calls are permission-gated (RBAC). Gate UI with `<RequirePermission>` / `usePermissions()` — never derive access from role names.
