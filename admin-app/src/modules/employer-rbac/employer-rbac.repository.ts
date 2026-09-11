// admin-app/src/modules/employer-rbac/employer-rbac.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmployerMemberRole } from '@prisma/client';

const EMPLOYER_ROLES = Object.values(EmployerMemberRole);

@Injectable()
export class EmployerRbacRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findMatrix() {
        const [permissions, grants] = await Promise.all([
            this.prisma.employerPermission.findMany({
                where: { isActive: true },
                orderBy: [{ module: 'asc' }, { action: 'asc' }],
            }),
            this.prisma.employerRolePermission.findMany({
                select: { role: true, permissionId: true },
            }),
        ]);

        const grantedRolesByPermission = new Map<string, EmployerMemberRole[]>();
        for (const grant of grants) {
            const list = grantedRolesByPermission.get(grant.permissionId) ?? [];
            list.push(grant.role);
            grantedRolesByPermission.set(grant.permissionId, list);
        }

        return {
            roles: EMPLOYER_ROLES,
            permissions: permissions.map((p) => ({
                ...p,
                grantedRoles: grantedRolesByPermission.get(p.id) ?? [],
            })),
        };
    }

    async setRoleGrants(role: EmployerMemberRole, permissionIds: string[], adminId: string) {
        await this.prisma.$transaction([
            this.prisma.employerRolePermission.deleteMany({ where: { role } }),
            this.prisma.employerRolePermission.createMany({
                data: permissionIds.map((permissionId) => ({ role, permissionId, updatedBy: adminId })),
                skipDuplicates: true,
            }),
        ]);

        return this.findMatrix();
    }
}
