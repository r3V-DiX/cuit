// libs/permissions/src/employer-rbac.registry.ts
// Single source of truth for the employer-role permission catalog and its
// seeded defaults. The employer-rbac:seed script upserts exactly this into
// the EmployerPermission / EmployerRolePermission tables — never edit those
// rows by hand. Defaults below reproduce the tiers that used to be hardcoded
// directly in permissions.service.ts (ALL_MEMBER/RECRUITER/MANAGER/OWNER
// action sets) so behavior is unchanged the moment this seed is applied.

import { EmployerMemberRole } from '@prisma/client';

export const EMPLOYER_ACTIONS = {
    JOBS: {
        READ: 'jobs:read',
        CREATE: 'jobs:create',
        UPDATE: 'jobs:update',
        DELETE: 'jobs:delete',
        PUBLISH: 'jobs:publish',
        CLOSE: 'jobs:close',
    },
    APPLICATIONS: {
        UPDATE_STATUS: 'applications:update_status',
        ADD_NOTE: 'applications:add_note',
        READ_ALL: 'applications:read_all',
    },
    COMPANY: {
        READ: 'company:read',
        UPDATE: 'company:update',
        SUBMIT_KYC: 'company:submit_kyc',
        INVITE_MEMBER: 'company:invite_member',
        REMOVE_MEMBER: 'company:remove_member',
        CHANGE_ROLE: 'company:change_role',
        TRANSFER_OWNER: 'company:transfer_owner',
        VIEW_ACTIVITY: 'company:view_activity',
    },
    SUBSCRIPTION: {
        READ: 'subscription:read',
        MANAGE: 'subscription:manage',
    },
} as const;

type ValuesOf<T> = T extends Record<string, infer V>
    ? V extends Record<string, string>
        ? ValuesOf<V>
        : V
    : never;

export type EmployerAction = ValuesOf<typeof EMPLOYER_ACTIONS>;

export const ALL_EMPLOYER_ACTIONS: readonly EmployerAction[] = Object.values(EMPLOYER_ACTIONS).flatMap(
    (group) => Object.values(group),
) as EmployerAction[];

export const EMPLOYER_PERMISSION_DESCRIPTIONS: Record<EmployerAction, string> = {
    'jobs:read': 'View jobs posted by the company',
    'jobs:create': 'Create new job postings (draft)',
    'jobs:update': 'Edit existing job postings',
    'jobs:delete': 'Delete job postings',
    'jobs:publish': 'Publish or close job postings',
    'jobs:close': 'Close a job posting to new applications',
    'applications:update_status': 'Change an applicant\'s status (shortlist, reject, etc.)',
    'applications:add_note': 'Add internal notes to an application',
    'applications:read_all': 'View every application across the organization',
    'company:read': 'View the company profile',
    'company:update': 'Edit the company profile',
    'company:submit_kyc': 'Submit or resubmit KYC verification documents',
    'company:invite_member': 'Invite new team members',
    'company:remove_member': 'Remove team members',
    'company:change_role': 'Change a team member\'s role',
    'company:transfer_owner': 'Transfer company ownership to another member',
    'company:view_activity': 'View the company activity log',
    'subscription:read': 'View subscription and billing details',
    'subscription:manage': 'Manage subscription plan and billing',
};

/** `module:action` → { module, action } for the EmployerPermission table's split columns. */
export function splitEmployerAction(action: EmployerAction): { module: string; action: string } {
    const [module, act] = action.split(':');
    return { module, action: act };
}

const ALL_MEMBER_TIER: readonly EmployerAction[] = [
    EMPLOYER_ACTIONS.COMPANY.READ,
    EMPLOYER_ACTIONS.COMPANY.VIEW_ACTIVITY,
    EMPLOYER_ACTIONS.JOBS.READ,
];

const RECRUITER_TIER: readonly EmployerAction[] = [
    ...ALL_MEMBER_TIER,
    EMPLOYER_ACTIONS.JOBS.CREATE,
    EMPLOYER_ACTIONS.JOBS.UPDATE,
    EMPLOYER_ACTIONS.JOBS.CLOSE,
    EMPLOYER_ACTIONS.APPLICATIONS.UPDATE_STATUS,
    EMPLOYER_ACTIONS.APPLICATIONS.ADD_NOTE,
    EMPLOYER_ACTIONS.APPLICATIONS.READ_ALL,
];

const MANAGER_TIER: readonly EmployerAction[] = [
    ...RECRUITER_TIER,
    EMPLOYER_ACTIONS.COMPANY.INVITE_MEMBER,
    EMPLOYER_ACTIONS.COMPANY.REMOVE_MEMBER,
    EMPLOYER_ACTIONS.JOBS.DELETE,
    EMPLOYER_ACTIONS.JOBS.PUBLISH,
];

const OWNER_TIER: readonly EmployerAction[] = [
    ...MANAGER_TIER,
    EMPLOYER_ACTIONS.COMPANY.CHANGE_ROLE,
    EMPLOYER_ACTIONS.COMPANY.TRANSFER_OWNER,
    EMPLOYER_ACTIONS.COMPANY.UPDATE,
    EMPLOYER_ACTIONS.COMPANY.SUBMIT_KYC,
    EMPLOYER_ACTIONS.SUBSCRIPTION.READ,
    EMPLOYER_ACTIONS.SUBSCRIPTION.MANAGE,
];

export const DEFAULT_EMPLOYER_ROLE_GRANTS: Record<EmployerMemberRole, readonly EmployerAction[]> = {
    OWNER: OWNER_TIER,
    HIRING_MANAGER: MANAGER_TIER,
    RECRUITER: RECRUITER_TIER,
    VIEWER: ALL_MEMBER_TIER,
};
