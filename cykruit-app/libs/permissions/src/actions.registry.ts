// libs/permissions/src/actions.registry.ts
// Single source of truth for all permission strings across the platform.
// Format: "module:action" — always lowercase, colon-separated.

export const ACTIONS = {
    // ── Jobs ─────────────────────────────────────────────────────────
    JOBS: {
        CREATE:         'jobs:create',
        READ:           'jobs:read',
        UPDATE:         'jobs:update',
        DELETE:         'jobs:delete',
        PUBLISH:        'jobs:publish',
        CLOSE:          'jobs:close',
        APPROVE:        'jobs:approve',        // admin
        REJECT:         'jobs:reject',         // admin
        FEATURE:        'jobs:feature',        // admin — mark as featured
    },

    // ── Applications ─────────────────────────────────────────────────
    APPLICATIONS: {
        READ:           'applications:read',
        UPDATE_STATUS:  'applications:update_status',
        ADD_NOTE:       'applications:add_note',
        READ_ALL:       'applications:read_all',   // hiring manager+ sees all org apps
    },

    // ── Company ───────────────────────────────────────────────────────
    COMPANY: {
        READ:           'company:read',
        UPDATE:         'company:update',
        SUBMIT_KYC:     'company:submit_kyc',
        APPROVE_KYC:    'company:approve_kyc',   // admin
        REJECT_KYC:     'company:reject_kyc',    // admin
        INVITE_MEMBER:  'company:invite_member',
        REMOVE_MEMBER:  'company:remove_member',
        CHANGE_ROLE:    'company:change_role',
        TRANSFER_OWNER: 'company:transfer_owner',
    },

    // ── Subscription ─────────────────────────────────────────────────
    SUBSCRIPTION: {
        READ:           'subscription:read',
        MANAGE:         'subscription:manage',       // admin
        CREATE_PACKAGE: 'subscription:create_package',
        UPDATE_PACKAGE: 'subscription:update_package',
        DELETE_PACKAGE: 'subscription:delete_package',
    },

    // ── Users (admin) ─────────────────────────────────────────────────
    USERS: {
        READ:           'users:read',
        SUSPEND:        'users:suspend',
        DELETE:         'users:delete',
        CHANGE_ROLE:    'users:change_role',
    },

    // ── Seekers ───────────────────────────────────────────────────────
    SEEKERS: {
        READ_PROFILE:   'seekers:read_profile',
        READ_CONTACT:   'seekers:read_contact',    // employer can see contact after apply
    },

    // ── Messaging ─────────────────────────────────────────────────────
    MESSAGES: {
        SEND:           'messages:send',
        READ:           'messages:read',
    },

    // ── Notifications ─────────────────────────────────────────────────
    NOTIFICATIONS: {
        READ:           'notifications:read',
        MANAGE:         'notifications:manage',
    },

    // ── Platform / Admin ──────────────────────────────────────────────
    PLATFORM: {
        MANAGE_ROLES:       'platform:manage_roles',
        MANAGE_PERMISSIONS: 'platform:manage_permissions',
        VIEW_AUDIT_LOGS:    'platform:view_audit_logs',
        MANAGE_CONTENT:     'platform:manage_content',  // blogs, events, gallery
        VIEW_ANALYTICS:     'platform:view_analytics',
    },
} as const;

type ValuesOf<T> = T[keyof T];
type ActionGroup = ValuesOf<typeof ACTIONS>;
export type ActionValue = ValuesOf<ActionGroup>;
