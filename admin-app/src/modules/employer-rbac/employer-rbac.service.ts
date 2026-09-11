// admin-app/src/modules/employer-rbac/employer-rbac.service.ts

import { Injectable } from '@nestjs/common';
import type { Prisma, EmployerMemberRole } from '@prisma/client';
import { EmployerRbacRepository } from './employer-rbac.repository';
import { AdminAuditLogger } from '../../common';
import { SetRoleGrantsDto } from './dto/employer-rbac.dto';

@Injectable()
export class EmployerRbacService {
    constructor(
        private readonly repo: EmployerRbacRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    getMatrix() {
        return this.repo.findMatrix();
    }

    async setRoleGrants(adminId: string, role: EmployerMemberRole, dto: SetRoleGrantsDto) {
        const updated = await this.repo.setRoleGrants(role, dto.permissionIds, adminId);

        this.auditLogger.log({
            adminId,
            action: 'employer_rbac:manage',
            module: 'employer_rbac',
            resource: 'EmployerRolePermission',
            resourceId: role,
            newData: { role, permissionIds: dto.permissionIds } as unknown as Prisma.InputJsonValue,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return updated;
    }
}
