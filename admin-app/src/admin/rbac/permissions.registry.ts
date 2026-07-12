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
        description: 'Day-to-day operations staff — everything except managing RBAC',
        grants: ALL_ACTIONS.filter((a) => a !== ACTIONS.RBAC.MANAGE),
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
        ],
    },
];

export const SYSTEM_ROLE_NAMES: readonly string[] = SYSTEM_ROLES.map((r) => r.name);
