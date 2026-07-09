# Cykruit Admin UI — UI/UX Brief

| | |
|---|---|
| **Product** | Cykruit Admin Dashboard (`admin-ui/`) |
| **Date** | 2026-07-09 |
| **Status** | Draft |
| **Related docs** | [PRD](PRD-admin-ui.md) · [TRD](TRD-admin-ui.md) · [App Flow](APP-FLOW-admin-ui.md) · [Backend Schema](BACKEND-SCHEMA-admin-ui.md) · [Implementation Plan](IMPLEMENTATION-PLAN-admin-ui.md) |

## 1. Design principle

**Admin-ui must look like it shipped with `cykruit-ui`.** Same brand, same tokens, same shell anatomy as the employer dashboard — an admin switching between the two products should feel zero visual friction. Where admin-ui differs, it differs toward *density and clarity* (tables, filters, status) rather than toward a new aesthetic. Decorative landing-page effects (floating orbs, scanner lines, terminal cursors) are used **only on the login page**, never inside the dashboard.

## 2. Design tokens (copied from `cykruit-ui/app/globals.css`)

Tailwind v4 CSS-first theme — `@import "tailwindcss"` + `@theme inline` in `admin-ui/app/globals.css`; **no `tailwind.config`**. Copy the token block verbatim:

| Token group | Values |
|---|---|
| Brand | `brand-blue #3B82F6`, `brand-blue-dark #2563EB`, `brand-blue-light #60A5FA`, `brand-cyan #06B6D4`, `brand-cyan-dark #0891B2` |
| Light backgrounds | page `bg-slate-50`, `bg-light #F8FAFD`, `bg-surface #F1F5F9`, cards `#ffffff` |
| Dark accents (decorative only) | `bg-darkest #050D1F`, `bg-dark #071323`, `bg-navy #0A1628` |
| Text | `text-dark #0D1F3C`, `text-body #1E293B`, `text-muted #64748B`, `text-light #94A3B8` |
| Borders | `border #E2E8F0`, `border-mid #CBD5E1` |
| Status | `success #22C55E`, `warning #F59E0B`, `danger #EF4444` |

Signature idioms to reuse: brand gradient `bg-linear-to-br from-blue-500 to-blue-600` (logo mark, primary buttons), `rounded-xl`/`rounded-2xl` cards with `border border-slate-200`, `font-mono` uppercase micro-labels for metadata, slim blue scrollbar, `.gradient-text` for the login headline. **Light mode only** (matches `cykruit-ui`).

Typography: same font setup as `cykruit-ui/app/layout.tsx` (`--font-sans` variable font). Scale: page title `text-2xl font-bold text-slate-900`, section `text-lg font-semibold`, body `text-sm`, table/meta `text-xs`.

## 3. App shell

Clone of the employer shell (`cykruit-ui/app/(employer)/layout.tsx` + `components/employer/EmployerSidebar.tsx` / `EmployerTopbar.tsx`):

- Root: `flex h-screen bg-slate-50 overflow-hidden`; fixed sidebar + scrollable `<main>`.
- **AdminSidebar**: collapsible desktop rail `w-56 ↔ w-16`; mobile slide-in overlay with hamburger + backdrop; active route highlighted via `usePathname` (blue-tinted bg + blue left indicator); brand block at top ("Cykruit **Admin**" — the gradient logo mark plus a distinguishing `font-mono text-[10px]` "ADMIN CONSOLE" tag so admins always know which product they're in); sign-out at bottom behind a confirm modal.
- Nav items (lucide icons): Dashboard `LayoutDashboard`, Users `Users`, KYC `ShieldCheck`, Jobs `Briefcase`, Subscriptions `CreditCard`, RBAC `KeyRound`, Audit Logs `ScrollText`. Each item is permission-gated and simply absent for admins who lack it ([App Flow §1](APP-FLOW-admin-ui.md)).
- Badge counts on KYC and Jobs nav items showing pending counts (from the dashboard stats fetch).
- **AdminTopbar**: page title (from route), admin identity (name + email from `/api/admin/me`), avatar initial in a brand-gradient circle.

Login page: centered card over the cyber-aesthetic backdrop (reuse `cykruit-ui/app/login/page.tsx` composition — `.bg-grid`, floating orbs, decorative shield SVG), stripped of seeker/employer tabs, Google OAuth, and register links.

## 4. Component inventory

Hand-rolled in `admin-ui/components/ui/` (no component library), following the `cykruit-ui/components/ui/` style:

**Copied/adapted from cykruit-ui**: `Button` (primary gradient / secondary / danger / ghost; loading state), `Badge`, `Modal` (+ `ModalProvider`), `Toast` (+ `ToastProvider`), `SearchBox`, `Providers`.

**New for admin-ui** (data-dense needs):

| Component | Purpose |
|---|---|
| `Table` | White card, sticky header row (`text-xs font-mono uppercase text-slate-500`), hover rows, clickable rows |
| `Pagination` | Prev/next + page numbers, renders from the API `pagination` object, shows "x–y of z" |
| `FilterBar` | Horizontal row of select pills + SearchBox; active filters visible; "Clear" affordance; syncs to URL query params (shareable/deep-linkable) |
| `StatCard` | Dashboard tile: icon in tinted rounded square, big number, label, optional trend/link |
| `StatusBadge` | Enum → color mapping (see §5) |
| `ConfirmModal` | Destructive confirm with optional/required reason textarea (suspend, reject, delete, revoke) |
| `EmptyState` | Icon + one-liner + optional action, centered in table area |
| `Skeleton` | Shimmering placeholders for tables/cards |
| `JsonViewer` | Collapsible `<pre>` for audit `oldData`/`newData` (font-mono, `text-xs`, `overflow-x-auto`) |
| `RequirePermission` | Renders children only if `usePermissions().has(action)` — wraps every gated button/nav item (PRD F9) |
| `NoAccess` | Full-page "You don't have access to this section" state (lock icon, muted copy, "Back to dashboard" button) — shell stays visible |

## 5. Status color system

Single mapping used everywhere (`StatusBadge`):

| Status | Style |
|---|---|
| `PENDING`, `UNDER_REVIEW` | amber — `bg-amber-50 text-amber-700 border-amber-200` |
| `APPROVED`, `ACTIVE`, `SUCCESS` | green — `bg-green-50 text-green-700 border-green-200` |
| `REJECTED`, `SUSPENDED`, `FAILURE`, `DENIED`, `CANCELLED` | red — `bg-red-50 text-red-700 border-red-200` |
| `DRAFT`, `INACTIVE`, `CLOSED`, `EXPIRED`, `DELETED`, `PENDING_DELETION` | slate — `bg-slate-100 text-slate-600 border-slate-200` |
| Roles: `ADMIN` blue / `EMPLOYER` cyan / `SEEKER` slate | tinted pills |
| Admin RBAC roles: `super_admin` blue-gradient pill · `platform_admin` blue · `reviewer` cyan · custom roles slate; system roles carry a small "System" tag | tinted pills |
| Audit `riskLevel`: `LOW` slate · `MEDIUM` amber · `HIGH` orange · `CRITICAL` red (bold) | escalating severity |

## 6. Interaction rules

- **Every mutation is confirm-gated.** Approve → normal confirm; reject/suspend/delete/revoke → danger-styled `ConfirmModal`. Where the API requires a reason (`rejectionReason`, job reject `reason`), the confirm button stays disabled until the field is non-empty.
- **Feedback**: success/error toast after every mutation; the acting button shows a spinner and disables while in flight; lists refetch after success.
- **Filters live in the URL** (`?status=PENDING&page=2`) so queue links from the dashboard and browser back/forward work.
- **Detail navigation**: table row click → detail page; breadcrumb-style back link (`← Back to queue`) top-left of detail pages.
- **Document viewing (KYC)**: document panel shows filename + "Open document" (new tab to S3 `documentUrl`) — no in-app PDF renderer in v1.
- **Empty/loading/error** states are mandatory per view (see [App Flow §4](APP-FLOW-admin-ui.md)).
- **Permission gating is invisible, not disabled.** Elements the admin can't use are *removed* (via `RequirePermission`), not rendered greyed-out — a Reviewer shouldn't see a disabled "Delete package" button, or the Subscriptions nav item at all. Exception: system-role protections in RBAC screens show a "System" tag with a tooltip explaining why editing is off.
- **Topbar identity** shows the admin's RBAC role pill(s) next to their name, so staff always know which hat they're wearing.

## 7. Layout patterns per page type

- **Queue/list pages**: page header (title + primary action button, e.g. "New package") → `FilterBar` → `Table` → `Pagination`.
- **Detail pages**: back link → header card (entity name + `StatusBadge` + action buttons right-aligned) → two-column grid `lg:grid-cols-3` (main content 2 cols, meta/timeline sidebar 1 col), collapsing to single column on smaller screens.
- **Dashboard**: 4-up `StatCard` grid (`grid-cols-2 lg:grid-cols-4`) → secondary row (trend numbers + pending-work shortcut cards).
- **Responsive**: fully usable at ≥1024px; at tablet the sidebar collapses to icons; phone gets the slide-in sidebar and horizontally scrollable tables (best-effort, per PRD §5).

## 8. Accessibility & quality bar

- All interactive elements keyboard-reachable; modals trap focus and close on Escape (match `cykruit-ui/components/ui/Modal.tsx` behavior).
- Status is never conveyed by color alone — badges always carry the status text.
- Buttons/inputs have visible focus rings (`focus-visible:ring-2 ring-blue-500`).
- Tables use real `<table>` semantics; icons paired with `aria-label`s where icon-only.
