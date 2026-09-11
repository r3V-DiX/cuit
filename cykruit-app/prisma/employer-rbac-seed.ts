// cykruit-app/prisma/employer-rbac-seed.ts
// Idempotent employer-RBAC seeder. Syncs the EmployerPermission catalog and
// upserts each EmployerMemberRole's EmployerRolePermission grant set to
// today's defaults (unchanged behavior on first run).
// Run: npm run employer-rbac:seed  (needs DATABASE_URL)
//
// Deliberately self-contained (no import from libs/permissions/src/
// employer-rbac.registry.ts): this script runs inside the deployed
// auth-service container (see scripts/deploy.sh's employer-rbac-seed
// target), which ships only dist/ + prisma/ + node_modules — no libs/
// source. Keep this catalog in sync with
// libs/permissions/src/employer-rbac.registry.ts by hand if either changes.

import 'dotenv/config';
import { PrismaClient, EmployerMemberRole } from '@prisma/client';

const prisma = new PrismaClient();

type Action =
    | 'jobs:read' | 'jobs:create' | 'jobs:update' | 'jobs:delete' | 'jobs:publish' | 'jobs:close'
    | 'applications:update_status' | 'applications:add_note' | 'applications:read_all'
    | 'company:read' | 'company:update' | 'company:submit_kyc' | 'company:invite_member'
    | 'company:remove_member' | 'company:change_role' | 'company:transfer_owner' | 'company:view_activity'
    | 'subscription:read' | 'subscription:manage';

const DESCRIPTIONS: Record<Action, string> = {
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

const ALL_MEMBER_TIER: Action[] = ['company:read', 'company:view_activity', 'jobs:read'];
const RECRUITER_TIER: Action[] = [...ALL_MEMBER_TIER, 'jobs:create', 'jobs:update', 'jobs:close', 'applications:update_status', 'applications:add_note', 'applications:read_all'];
const MANAGER_TIER: Action[] = [...RECRUITER_TIER, 'company:invite_member', 'company:remove_member', 'jobs:delete', 'jobs:publish'];
const OWNER_TIER: Action[] = [...MANAGER_TIER, 'company:change_role', 'company:transfer_owner', 'company:update', 'company:submit_kyc', 'subscription:read', 'subscription:manage'];

const DEFAULT_GRANTS: Record<EmployerMemberRole, Action[]> = {
    OWNER: OWNER_TIER,
    HIRING_MANAGER: MANAGER_TIER,
    RECRUITER: RECRUITER_TIER,
    VIEWER: ALL_MEMBER_TIER,
};

function splitAction(action: Action): { module: string; action: string } {
    const [module, act] = action.split(':');
    return { module, action: act };
}

async function seedPermissions(): Promise<Map<Action, string>> {
    const idByAction = new Map<Action, string>();

    for (const fullAction of Object.keys(DESCRIPTIONS) as Action[]) {
        const { module, action } = splitAction(fullAction);
        const permission = await prisma.employerPermission.upsert({
            where: { module_action: { module, action } },
            create: { module, action, description: DESCRIPTIONS[fullAction], isActive: true },
            update: { description: DESCRIPTIONS[fullAction], isActive: true },
        });
        idByAction.set(fullAction, permission.id);
    }

    console.log(`✔ Employer permissions synced (${idByAction.size})`);
    return idByAction;
}

async function seedRoleGrants(idByAction: Map<Action, string>): Promise<void> {
    for (const role of Object.values(EmployerMemberRole)) {
        const grants = DEFAULT_GRANTS[role];
        const permissionIds = grants.map((a) => {
            const id = idByAction.get(a);
            if (!id) throw new Error(`Registry inconsistency: no permission id for ${a}`);
            return id;
        });

        await prisma.$transaction([
            prisma.employerRolePermission.deleteMany({ where: { role } }),
            prisma.employerRolePermission.createMany({
                data: permissionIds.map((permissionId) => ({ role, permissionId, updatedBy: 'employer-rbac-seed' })),
                skipDuplicates: true,
            }),
        ]);

        console.log(`✔ Role "${role}" synced (${permissionIds.length} permissions)`);
    }
}

async function main() {
    const idByAction = await seedPermissions();
    await seedRoleGrants(idByAction);
    console.log('✔ Employer RBAC seed complete');
}

main()
    .catch((error) => {
        console.error('✖ Employer RBAC seed failed:', error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
