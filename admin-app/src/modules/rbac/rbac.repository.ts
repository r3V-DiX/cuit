// admin-app/src/admin/repositories/rbac.repository.ts
// Console RBAC data access — Admin* tables only (AdminRbacRole / AdminPermission /
// AdminRolePermission / AdminRoleAssignment / AdminPermissionOverride).

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';

@Injectable()
export class RbacRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── Roles ─────────────────────────────────────────────────────────────────

    async findAllRoles() {
        return this.prisma.adminRbacRole.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
    }

    async findRoleById(id: string) {
        return this.prisma.adminRbacRole.findUnique({
            where: { id },
            include: {
                permissions: { include: { permission: true } },
            },
        });
    }

    async createRole(dto: CreateRoleDto) {
        return this.prisma.adminRbacRole.create({
            data: {
                name: dto.name,
                description: dto.description,
                ...(dto.permissionIds?.length
                    ? {
                          permissions: {
                              create: dto.permissionIds.map((permissionId) => ({ permissionId })),
                          },
                      }
                    : {}),
            },
            include: { permissions: { include: { permission: true } } },
        });
    }

    async updateRole(id: string, dto: UpdateRoleDto) {
        return this.prisma.adminRbacRole.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            },
        });
    }

    async setRolePermissions(roleId: string, permissionIds: string[]) {
        await this.prisma.$transaction([
            this.prisma.adminRolePermission.deleteMany({ where: { roleId } }),
            this.prisma.adminRolePermission.createMany({
                data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
                skipDuplicates: true,
            }),
        ]);

        return this.findRoleById(roleId);
    }

    async countRoleAssignments(roleId: string) {
        return this.prisma.adminRoleAssignment.count({ where: { roleId } });
    }

    /** Same as countRoleAssignments but excludes deactivated admins — used for the
     *  "don't strip the last super_admin" guards, where an inactive admin's
     *  assignment row shouldn't count as a real safety margin. */
    async countActiveRoleAssignments(roleId: string) {
        return this.prisma.adminRoleAssignment.count({
            where: { roleId, admin: { isActive: true } },
        });
    }

    async deleteRole(id: string) {
        return this.prisma.adminRbacRole.delete({ where: { id } });
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    async findAllPermissions() {
        return this.prisma.adminPermission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }],
        });
    }

// ── Admin role assignments ────────────────────────────────────────────────

    /** Admins hold exactly one role — assigning a new one replaces any other the admin currently has. */
    async assignAdminRole(adminId: string, roleId: string, assignedBy: string, expiresAt?: Date) {
        return this.prisma.$transaction(async (tx) => {
            await tx.adminRoleAssignment.deleteMany({
                where: { adminId, roleId: { not: roleId } },
            });

            return tx.adminRoleAssignment.upsert({
                where: { adminId_roleId: { adminId, roleId } },
                create: { adminId, roleId, assignedBy, expiresAt },
                update: { assignedBy, expiresAt },
            });
        });
    }

    async revokeAdminRole(assignmentId: string) {
        return this.prisma.adminRoleAssignment.delete({ where: { id: assignmentId } });
    }

    async findAdminRoleAssignmentById(id: string) {
        return this.prisma.adminRoleAssignment.findUnique({
            where: { id },
            include: { role: true, admin: { select: { email: true } } },
        });
    }

    async findAdminEmail(adminId: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
            select: { email: true },
        });
        return admin?.email ?? null;
    }

    async findAdminSummary(adminId: string) {
        return this.prisma.admin.findUnique({
            where: { id: adminId },
            select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
        });
    }

    async findAdminRoles(adminId: string) {
        return this.prisma.adminRoleAssignment.findMany({
            where: { adminId },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
    }

    // ── Admin permission overrides ────────────────────────────────────────────

    async overrideAdminPermission(
        adminId: string,
        permissionId: string,
        grant: boolean,
        grantedBy: string,
        reason?: string,
    ) {
        return this.prisma.adminPermissionOverride.upsert({
            where: { adminId_permissionId: { adminId, permissionId } },
            create: { adminId, permissionId, grant, grantedBy, reason },
            update: { grant, grantedBy, reason },
        });
    }

    async findAdminPermissionOverrides(adminId: string) {
        return this.prisma.adminPermissionOverride.findMany({
            where: { adminId },
            include: { permission: true },
        });
    }

    async deleteAdminPermissionOverride(id: string) {
        return this.prisma.adminPermissionOverride.delete({ where: { id } });
    }

    async findAdminPermissionOverrideById(id: string) {
        return this.prisma.adminPermissionOverride.findUnique({
            where: { id },
            include: { admin: { select: { email: true } } },
        });
    }
}
