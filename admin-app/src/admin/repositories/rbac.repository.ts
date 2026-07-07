// admin-app/src/admin/repositories/rbac.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { CreateRoleDto, UpdateRoleDto } from '../dto/rbac.dto';

@Injectable()
export class RbacRepository {
    constructor(private readonly prisma: PrismaService) {}

    // ── Roles ─────────────────────────────────────────────────────────────────

    async findAllRoles() {
        return this.prisma.rbacRole.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
    }

    async findRoleById(id: string) {
        return this.prisma.rbacRole.findUnique({
            where: { id },
            include: {
                permissions: { include: { permission: true } },
            },
        });
    }

    async createRole(dto: CreateRoleDto) {
        return this.prisma.rbacRole.create({
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
        return this.prisma.rbacRole.update({
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
            this.prisma.rolePermission.deleteMany({ where: { roleId } }),
            this.prisma.rolePermission.createMany({
                data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
                skipDuplicates: true,
            }),
        ]);

        return this.findRoleById(roleId);
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    async findAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }],
        });
    }

    // ── User role assignments ─────────────────────────────────────────────────

    async assignUserRole(
        userId: string,
        roleId: string,
        assignedBy: string,
        employerId?: string,
        expiresAt?: Date,
    ) {
        // upsert on the 3-field unique key — idempotent, updates assignedBy/expiresAt on re-assign
        return this.prisma.userRoleAssignment.upsert({
            where: {
                userId_roleId_employerId: { userId, roleId, employerId: employerId ?? null },
            },
            create: { userId, roleId, assignedBy, employerId, expiresAt },
            update: { assignedBy, expiresAt },
        });
    }

    async revokeUserRole(assignmentId: string) {
        return this.prisma.userRoleAssignment.delete({ where: { id: assignmentId } });
    }

    async findUserRoles(userId: string) {
        return this.prisma.userRoleAssignment.findMany({
            where: { userId },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
    }

    // ── User permission overrides ─────────────────────────────────────────────

    async overrideUserPermission(
        userId: string,
        permissionId: string,
        grant: boolean,
        grantedBy: string,
        reason?: string,
        employerId?: string,
    ) {
        return this.prisma.userPermissionOverride.upsert({
            where: {
                userId_permissionId_employerId: {
                    userId,
                    permissionId,
                    employerId: employerId ?? null,
                },
            },
            create: { userId, permissionId, grant, grantedBy, reason, employerId },
            update: { grant, grantedBy, reason },
        });
    }

    async findUserPermissionOverrides(userId: string) {
        return this.prisma.userPermissionOverride.findMany({
            where: { userId },
            include: { permission: true },
        });
    }
}
