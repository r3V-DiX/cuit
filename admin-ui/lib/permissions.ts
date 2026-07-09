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
} as const;

type ValuesOf<T> = T extends Record<string, infer V>
  ? V extends Record<string, string>
    ? ValuesOf<V>
    : V
  : never;

export type Action = ValuesOf<typeof ACTIONS>;
