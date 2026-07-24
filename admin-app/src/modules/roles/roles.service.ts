// admin-app/src/modules/roles/roles.service.ts

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { RolesRepository } from './roles.repository';
import { AdminAuditLogger } from '../../common';
import { CreateRoleDto, RoleListQueryDto, UpdateRoleDto } from './dto/roles.dto';

@Injectable()
export class RolesService {
    constructor(
        private readonly repo: RolesRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: RoleListQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const role = await this.repo.findById(id);
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async create(adminId: string, dto: CreateRoleDto) {
        const created = await this.repo.create(dto);

        this.auditLogger.log({
            adminId,
            action: 'roles:create',
            module: 'roles',
            resource: 'Role',
            resourceId: created.id,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateRoleDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto);

        this.auditLogger.log({
            adminId,
            action: 'roles:update',
            module: 'roles',
            resource: 'Role',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async toggle(adminId: string, id: string) {
        const existing = await this.getById(id);
        const updated = await this.repo.setActive(id, !existing.isActive);

        this.auditLogger.log({
            adminId,
            action: 'roles:toggle',
            module: 'roles',
            resource: 'Role',
            resourceId: id,
            oldData: { isActive: existing.isActive } as unknown as Prisma.InputJsonValue,
            newData: { isActive: updated.isActive } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async delete(adminId: string, id: string) {
        await this.getById(id);

        const jobCount = await this.repo.countJobsUsingRole(id);
        if (jobCount > 0) {
            throw new ConflictException(
                `Cannot delete — ${jobCount} job(s) still reference this role. Reassign or remove them first.`,
            );
        }

        await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'roles:delete',
            module: 'roles',
            resource: 'Role',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: 'Role deleted' };
    }
}
