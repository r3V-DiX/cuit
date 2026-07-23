// admin-app/src/admin/rbac/permissions.registry.ts
// Single source of truth for the admin permission catalog and seeded system roles.
// The rbac:seed script upserts exactly this into the Permission / RbacRole tables —
// never edit those rows by hand (docs/admin-ui/BACKEND-SCHEMA-admin-ui.md §7).

export const ACTIONS = {
    DASHBOARD: {
        VIEW: 'dashboard:view',
    },
    USERS: {
        VIEW: 'users:view',
        SUSPEND: 'users:suspend',
        DELETE: 'users:delete',
        UNLOCK: 'users:unlock',
    },
    KYC: {
        VIEW: 'kyc:view',
        REVIEW: 'kyc:review',
    },
    JOBS: {
        VIEW: 'jobs:view',
        REVIEW: 'jobs:review',
    },
    SUBSCRIPTIONS: {
        VIEW: 'subscriptions:view',
        MANAGE: 'subscriptions:manage',
    },
    RBAC: {
        VIEW: 'rbac:view',
        MANAGE: 'rbac:manage',
    },
    AUDIT: {
        VIEW: 'audit:view',
    },
    TESTIMONIALS: {
        VIEW: 'testimonials:view',
        MANAGE: 'testimonials:manage',
    },
    DISCOUNTS: {
        VIEW: 'discounts:view',
        MANAGE: 'discounts:manage',
    },
    ADMINS: {
        VIEW: 'admins:view',
        MANAGE: 'admins:manage',
    },
    CONTACT: {
        VIEW: 'contact:view',
        MANAGE: 'contact:manage',
    },
    SETTINGS: {
        VIEW: 'settings:view',
        MANAGE: 'settings:manage',
    },
    REPORTS: {
        VIEW: 'reports:view',
        MANAGE: 'reports:manage',
    },
    POLICIES: {
        VIEW: 'policies:view',
        MANAGE: 'policies:manage',
    },
    ANNOUNCEMENTS: {
        VIEW: 'announcements:view',
        MANAGE: 'announcements:manage',
    },
    BLACKLIST: {
        VIEW: 'blacklist:view',
        MANAGE: 'blacklist:manage',
    },
    SUGGESTIONS: {
        VIEW: 'suggestions:view',
        MANAGE: 'suggestions:manage',
    },
    EXPORT: {
        RUN: 'export:run',
    },
} as const;

type ValuesOf<T> = T extends Record<string, infer V>
    ? V extends Record<string, string>
        ? ValuesOf<V>
        : V
    : never;

export type Action = ValuesOf<typeof ACTIONS>;

export const ALL_ACTIONS: readonly Action[] = Object.values(ACTIONS).flatMap(
    (group) => Object.values(group),
) as Action[];

export const PERMISSION_DESCRIPTIONS: Record<Action, string> = {
    'dashboard:view': 'View the overview dashboard and platform stats',
    'users:view': 'List and view user accounts',
    'users:suspend': 'Suspend and unsuspend user accounts',
    'users:delete': 'Soft-delete user accounts',
    'users:unlock': 'Clear failed-login lockouts on user accounts',
    'kyc:view': 'View employer verification (KYC) submissions',
    'kyc:review': 'Approve or reject employer verifications',
    'jobs:view': 'View the job moderation queue and job details',
    'jobs:review': 'Approve or reject job postings',
    'subscriptions:view': 'View subscription packages and employer subscriptions',
    'subscriptions:manage': 'Create/edit/delete packages and manage employer subscriptions',
    'rbac:view': 'View roles, permissions, assignments and overrides',
    'rbac:manage': 'Create/edit roles, assign roles and set permission overrides',
    'audit:view': 'View the admin audit log',
    'testimonials:view': 'List and view testimonials',
    'testimonials:manage': 'Create/edit/delete and publish/unpublish testimonials',
    'discounts:view': 'List and view discount/coupon records and usage stats',
    'discounts:manage': 'Create/edit/deactivate discounts and coupon codes',
    'admins:view': 'List and view admin console accounts',
    'admins:manage': 'Invite, deactivate and reactivate admin console accounts',
    'contact:view': 'List and view contact form submissions',
    'contact:manage': 'Update the status/notes on contact form submissions',
    'settings:view': 'View platform feature-flag settings',
    'settings:manage': 'Change platform feature-flag values',
    'reports:view': 'List and view flagged-content reports',
    'reports:manage': 'Resolve or dismiss flagged-content reports',
    'policies:view': 'View platform rate-limit and policy values',
    'policies:manage': 'Change platform rate-limit and policy values',
    'announcements:view': 'List and view site-wide announcements',
    'announcements:manage': 'Create/edit/delete and activate/deactivate announcements',
    'blacklist:view': 'List and view blocked emails/domains',
    'blacklist:manage': 'Add and remove blocked emails/domains',
    'suggestions:view': 'List and view search-box autocomplete suggestions',
    'suggestions:manage': 'Create/edit/delete and activate/deactivate search suggestions',
    'export:run': 'Export users, jobs, applications and subscriptions as CSV',
};

/** `module:action` → { module, action } for the Permission table's split columns. */
export function splitAction(action: Action): { module: string; action: string } {
    const [module, act] = action.split(':');
    return { module, action: act };
}

export const SUPER_ADMIN_ROLE = 'super_admin';

export interface SystemRoleDefinition {
    name: string;
    description: string;
    /** 'ALL' = every permission in the catalog (super_admin also bypasses the pipeline). */
    grants: 'ALL' | readonly Action[];
}

export const SYSTEM_ROLES: readonly SystemRoleDefinition[] = [
    {
        name: SUPER_ADMIN_ROLE,
        description:
            'Platform owners — full control including RBAC itself (evaluation-pipeline bypass)',
        grants: 'ALL',
    },
    {
        name: 'platform_admin',
        description:
            'Day-to-day operations staff — everything except managing RBAC, admin accounts, platform settings, policy values, and deleting users',
        grants: ALL_ACTIONS.filter(
            (a) =>
                a !== ACTIONS.RBAC.MANAGE &&
                a !== ACTIONS.ADMINS.VIEW &&
                a !== ACTIONS.ADMINS.MANAGE &&
                a !== ACTIONS.USERS.DELETE &&
                a !== ACTIONS.SETTINGS.MANAGE &&
                a !== ACTIONS.POLICIES.MANAGE,
        ),
    },
    {
        name: 'reviewer',
        description: 'Moderation staff — KYC and job review plus read-only dashboards',
        grants: [
            ACTIONS.DASHBOARD.VIEW,
            ACTIONS.USERS.VIEW,
            ACTIONS.KYC.VIEW,
            ACTIONS.KYC.REVIEW,
            ACTIONS.JOBS.VIEW,
            ACTIONS.JOBS.REVIEW,
            ACTIONS.REPORTS.VIEW,
        ],
    },
];

export const SYSTEM_ROLE_NAMES: readonly string[] = SYSTEM_ROLES.map((r) => r.name);
