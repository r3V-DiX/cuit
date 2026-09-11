// admin-ui/lib/permissions.ts
// Frontend mirror of the backend ACTIONS constant (admin-app/src/admin/rbac/permissions.registry.ts).
// Used for compile-time safety — the UI never re-implements evaluation, it only
// consumes the resolved permission list from GET /api/admin/me.

export const ACTIONS = {
  DASHBOARD: { VIEW: 'dashboard:view' },
  USERS: { VIEW: 'users:view', SUSPEND: 'users:suspend', DELETE: 'users:delete', UNLOCK: 'users:unlock' },
  KYC: { VIEW: 'kyc:view', REVIEW: 'kyc:review' },
  JOBS: { VIEW: 'jobs:view', REVIEW: 'jobs:review', FEATURE: 'jobs:feature' },
  RESUMES: { VIEW: 'resumes:view' },
  APPLICATIONS: { VIEW: 'applications:view' },
  SUBSCRIPTIONS: { VIEW: 'subscriptions:view', MANAGE: 'subscriptions:manage' },
  RBAC: { VIEW: 'rbac:view', MANAGE: 'rbac:manage' },
  EMPLOYER_RBAC: { VIEW: 'employer_rbac:view', MANAGE: 'employer_rbac:manage' },
  AUDIT: { VIEW: 'audit:view' },
  TESTIMONIALS: { VIEW: 'testimonials:view', MANAGE: 'testimonials:manage' },
  DISCOUNTS: { VIEW: 'discounts:view', MANAGE: 'discounts:manage' },
  ADMINS: { VIEW: 'admins:view', MANAGE: 'admins:manage' },
  CONTACT: { VIEW: 'contact:view', MANAGE: 'contact:manage' },
  SETTINGS: { VIEW: 'settings:view', MANAGE: 'settings:manage' },
  REPORTS: { VIEW: 'reports:view', MANAGE: 'reports:manage' },
  POLICIES: { VIEW: 'policies:view', MANAGE: 'policies:manage' },
  ANNOUNCEMENTS: { VIEW: 'announcements:view', MANAGE: 'announcements:manage' },
  BLACKLIST: { VIEW: 'blacklist:view', MANAGE: 'blacklist:manage' },
  SUGGESTIONS: { VIEW: 'suggestions:view', MANAGE: 'suggestions:manage' },
  EXPORT: { RUN: 'export:run' },
  DOMAINS: { VIEW: 'domains:view', MANAGE: 'domains:manage' },
  ROLES: { VIEW: 'roles:view', MANAGE: 'roles:manage' },
  EMAILS: { VIEW: 'emails:view', SEND: 'emails:send' },
  BLOGS: { VIEW: 'blogs:view', MANAGE: 'blogs:manage' },
  ADS: { VIEW: 'ads:view', MANAGE: 'ads:manage' },
  EVENTS: { VIEW: 'events:view', MANAGE: 'events:manage' },
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
