/**
 * scripts/seed-rbac.ts
 *
 * Seeds Permission rows from the ACTIONS registry and creates default
 * SystemRole rows (super_admin, content_moderator, kyc_reviewer).
 *
 * Run: ts-node -r tsconfig-paths/register --project ../cykruit-app/tsconfig.json scripts/seed-rbac.ts
 * Or:  npx ts-node -r ./tsconfig-paths-bootstrap.js scripts/seed-rbac.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
});

// Flat list of all permission action strings from ACTIONS registry
const ALL_PERMISSIONS: Array<{ module: string; action: string; description: string }> = [
    // Jobs
    { module: 'jobs', action: 'jobs:create',   description: 'Create job postings' },
    { module: 'jobs', action: 'jobs:read',     description: 'Read job postings' },
    { module: 'jobs', action: 'jobs:update',   description: 'Update job postings' },
    { module: 'jobs', action: 'jobs:delete',   description: 'Delete job postings' },
    { module: 'jobs', action: 'jobs:publish',  description: 'Publish job postings' },
    { module: 'jobs', action: 'jobs:close',    description: 'Close job postings' },
    { module: 'jobs', action: 'jobs:approve',  description: 'Approve job postings (admin)' },
    { module: 'jobs', action: 'jobs:reject',   description: 'Reject job postings (admin)' },
    { module: 'jobs', action: 'jobs:feature',  description: 'Mark jobs as featured (admin)' },

    // Applications
    { module: 'applications', action: 'applications:read',          description: 'Read applications' },
    { module: 'applications', action: 'applications:update_status', description: 'Update application status' },
    { module: 'applications', action: 'applications:add_note',      description: 'Add notes to applications' },
    { module: 'applications', action: 'applications:read_all',      description: 'Read all org applications (hiring manager+)' },

    // Company
    { module: 'company', action: 'company:read',           description: 'Read company profile' },
    { module: 'company', action: 'company:update',         description: 'Update company profile' },
    { module: 'company', action: 'company:submit_kyc',     description: 'Submit KYC documents' },
    { module: 'company', action: 'company:approve_kyc',    description: 'Approve KYC (admin)' },
    { module: 'company', action: 'company:reject_kyc',     description: 'Reject KYC (admin)' },
    { module: 'company', action: 'company:invite_member',  description: 'Invite team members' },
    { module: 'company', action: 'company:remove_member',  description: 'Remove team members' },
    { module: 'company', action: 'company:change_role',    description: 'Change member role' },
    { module: 'company', action: 'company:transfer_owner', description: 'Transfer company ownership' },

    // Subscription
    { module: 'subscription', action: 'subscription:read',           description: 'Read subscription info' },
    { module: 'subscription', action: 'subscription:manage',         description: 'Manage subscriptions (admin)' },
    { module: 'subscription', action: 'subscription:create_package', description: 'Create subscription packages' },
    { module: 'subscription', action: 'subscription:update_package', description: 'Update subscription packages' },
    { module: 'subscription', action: 'subscription:delete_package', description: 'Delete subscription packages' },

    // Users
    { module: 'users', action: 'users:read',        description: 'Read user accounts' },
    { module: 'users', action: 'users:suspend',     description: 'Suspend user accounts' },
    { module: 'users', action: 'users:delete',      description: 'Delete user accounts' },
    { module: 'users', action: 'users:change_role', description: 'Change user role' },

    // Seekers
    { module: 'seekers', action: 'seekers:read_profile', description: 'Read seeker profile' },
    { module: 'seekers', action: 'seekers:read_contact', description: 'Read seeker contact info' },

    // Messages
    { module: 'messages', action: 'messages:send', description: 'Send messages' },
    { module: 'messages', action: 'messages:read', description: 'Read messages' },

    // Notifications
    { module: 'notifications', action: 'notifications:read',   description: 'Read notifications' },
    { module: 'notifications', action: 'notifications:manage', description: 'Manage notifications' },

    // Platform
    { module: 'platform', action: 'platform:manage_roles',       description: 'Manage RBAC roles' },
    { module: 'platform', action: 'platform:manage_permissions', description: 'Manage RBAC permissions' },
    { module: 'platform', action: 'platform:view_audit_logs',    description: 'View audit logs' },
    { module: 'platform', action: 'platform:manage_content',     description: 'Manage platform content' },
    { module: 'platform', action: 'platform:view_analytics',     description: 'View platform analytics' },
];

const DEFAULT_ROLES: Array<{
    name: string;
    description: string;
    isSystem: boolean;
    permissions: string[];
}> = [
    {
        name: 'super_admin',
        description: 'Full platform access — all permissions',
        isSystem: true,
        permissions: ALL_PERMISSIONS.map((p) => p.action),
    },
    {
        name: 'kyc_reviewer',
        description: 'Can review and approve/reject employer KYC submissions',
        isSystem: true,
        permissions: [
            'company:read',
            'company:approve_kyc',
            'company:reject_kyc',
            'platform:view_audit_logs',
        ],
    },
    {
        name: 'content_moderator',
        description: 'Can approve/reject job postings and manage platform content',
        isSystem: true,
        permissions: [
            'jobs:read',
            'jobs:approve',
            'jobs:reject',
            'jobs:feature',
            'platform:manage_content',
            'platform:view_audit_logs',
        ],
    },
];

async function main() {
    console.log('Seeding permissions...');

    // Upsert all permissions
    for (const perm of ALL_PERMISSIONS) {
        await prisma.permission.upsert({
            where: { module_action: { module: perm.module, action: perm.action } },
            create: perm,
            update: { description: perm.description },
        });
    }

    console.log(`  ${ALL_PERMISSIONS.length} permissions seeded`);

    console.log('Seeding system roles...');

    for (const roleDef of DEFAULT_ROLES) {
        const { permissions, ...roleData } = roleDef;

        const role = await prisma.systemRole.upsert({
            where: { name: roleDef.name },
            create: { ...roleData, isActive: true },
            update: { description: roleData.description },
        });

        // Fetch permission IDs
        const permRecords = await prisma.permission.findMany({
            where: { action: { in: permissions } },
            select: { id: true },
        });

        // Replace all role-permission mappings
        await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
        if (permRecords.length) {
            await prisma.rolePermission.createMany({
                data: permRecords.map((p) => ({ roleId: role.id, permissionId: p.id })),
                skipDuplicates: true,
            });
        }

        console.log(`  ${role.name} — ${permRecords.length} permissions`);
    }

    console.log('RBAC seed complete');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
