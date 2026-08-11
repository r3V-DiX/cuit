// admin-app/prisma/rbac-seed.ts
// Idempotent console-RBAC seeder (docs/admin-ui/BACKEND-SCHEMA-admin-ui.md §5.2).
// Syncs the AdminPermission catalog from the registry, upserts the three system
// roles with their AdminRolePermission sets, and assigns super_admin to the
// bootstrap admin (matched in the admins table).
// Run: npm run rbac:seed  (needs DATABASE_URL; optional RBAC_BOOTSTRAP_ADMIN_EMAIL)

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
    ALL_ACTIONS,
    PERMISSION_DESCRIPTIONS,
    SYSTEM_ROLES,
    SUPER_ADMIN_ROLE,
    splitAction,
    Action,
} from '../src/common/rbac/permissions.registry';

const prisma = new PrismaClient();

async function seedPermissions(): Promise<Map<Action, string>> {
    const idByAction = new Map<Action, string>();

    for (const fullAction of ALL_ACTIONS) {
        const { module, action } = splitAction(fullAction);
        const permission = await prisma.adminPermission.upsert({
            where: { module_action: { module, action } },
            create: {
                module,
                action,
                description: PERMISSION_DESCRIPTIONS[fullAction],
                isActive: true,
            },
            update: {
                description: PERMISSION_DESCRIPTIONS[fullAction],
                isActive: true,
            },
        });
        idByAction.set(fullAction, permission.id);
    }

    console.log(`✔ Admin permissions synced (${idByAction.size})`);
    return idByAction;
}

async function seedRoles(idByAction: Map<Action, string>): Promise<Map<string, string>> {
    const roleIdByName = new Map<string, string>();

    for (const def of SYSTEM_ROLES) {
        const role = await prisma.adminRbacRole.upsert({
            where: { name: def.name },
            create: { name: def.name, description: def.description, isActive: true },
            update: { description: def.description, isActive: true },
        });
        roleIdByName.set(def.name, role.id);

        const grants: readonly Action[] = def.grants === 'ALL' ? ALL_ACTIONS : def.grants;
        const permissionIds = grants.map((a) => {
            const id = idByAction.get(a);
            if (!id) throw new Error(`Registry inconsistency: no permission id for ${a}`);
            return id;
        });

        await prisma.$transaction([
            prisma.adminRolePermission.deleteMany({ where: { roleId: role.id } }),
            prisma.adminRolePermission.createMany({
                data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
                skipDuplicates: true,
            }),
        ]);

        console.log(`✔ Role "${def.name}" synced (${permissionIds.length} permissions)`);
    }

    return roleIdByName;
}

async function bootstrapSuperAdmin(roleIdByName: Map<string, string>): Promise<void> {
    const email = process.env.RBAC_BOOTSTRAP_ADMIN_EMAIL;
    if (!email) {
        console.log('ℹ RBAC_BOOTSTRAP_ADMIN_EMAIL not set — skipping bootstrap assignment');
        return;
    }

    let admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
        admin = await prisma.admin.create({
            data: {
                email,
                firstName: 'Super',
                lastName: 'Admin',
            },
        });
        console.log(`✔ Bootstrap admin "${email}" created — sign in via email + OTP`);
    }

    const roleId = roleIdByName.get(SUPER_ADMIN_ROLE);
    if (!roleId) throw new Error('super_admin role missing after seed');

    await prisma.adminRoleAssignment.upsert({
        where: { adminId_roleId: { adminId: admin.id, roleId } },
        create: { adminId: admin.id, roleId, assignedBy: 'rbac-seed' },
        update: { expiresAt: null, assignedBy: 'rbac-seed' },
    });

    console.log(`✔ super_admin assigned to ${email}`);
}

async function main() {
    const idByAction = await seedPermissions();
    const roleIdByName = await seedRoles(idByAction);
    await bootstrapSuperAdmin(roleIdByName);
    console.log('✔ RBAC seed complete');
}

main()
    .catch((error) => {
        console.error('✖ RBAC seed failed:', error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
