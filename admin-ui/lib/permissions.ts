// admin-ui/lib/permissions.ts
// Frontend mirror of the backend ACTIONS constant (admin-app/src/admin/rbac/permissions.registry.ts).
// Used for compile-time safety — the UI never re-implements evaluation, it only
// consumes the resolved permission list from GET /api/admin/me.

export const ACTIONS = {
  DASHBOARD: { VIEW: 'dashboard:view' },
  USERS: { VIEW: 'users:view', SUSPEND: 'users:suspend' },
  KYC: { VIEW: 'kyc:view', REVIEW: 'kyc:review' },
  JOBS: { VIEW: 'jobs:view', REVIEW: 'jobs:review' },
  SUBSCRIPTIONS: { VIEW: 'subscriptions:view', MANAGE: 'subscriptions:manage' },
  RBAC: { VIEW: 'rbac:view', MANAGE: 'rbac:manage' },
  AUDIT: { VIEW: 'audit:view' },
  TESTIMONIALS: { VIEW: 'testimonials:view', MANAGE: 'testimonials:manage' },
} as const;

type ValuesOf<T> = T extends Record<string, infer V>
  ? V extends Record<string, string>
    ? ValuesOf<V>
    : V
  : never;

export type Action = ValuesOf<typeof ACTIONS>;

// Frontend mirror of SYSTEM_ROLES in the backend registry — seed-owned roles
// that cannot be renamed or deactivated; super_admin's permission set is locked.
export const SUPER_ADMIN_ROLE = 'super_admin';
export const SYSTEM_ROLE_NAMES: readonly string[] = [
  SUPER_ADMIN_ROLE,
  'platform_admin',
  'reviewer',
];
