# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Admin UI specifics

- This app is the admin console (port 3100). Its product/tech specs live in `../docs/admin-ui/` — follow them.
- Mirror `../cykruit-ui` conventions exactly (Tailwind v4 CSS-first theme, hand-rolled `components/ui/`, native fetch, `proxy.ts` not `middleware.ts`).
- All `/api/admin/*` calls are permission-gated (RBAC). Gate UI with `<RequirePermission>` / `usePermissions()` — never derive access from role names.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
