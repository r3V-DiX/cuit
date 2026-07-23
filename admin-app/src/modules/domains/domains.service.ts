// admin-app/src/modules/domains/domains.service.ts

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DomainsRepository } from './domains.repository';
import { AdminAuditLogger } from '../../common';
import { CreateDomainDto, DomainListQueryDto, UpdateDomainDto } from './dto/domains.dto';

@Injectable()
export class DomainsService {
    constructor(
        private readonly repo: DomainsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: DomainListQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const domain = await this.repo.findById(id);
        if (!domain) throw new NotFoundException('Job domain not found');
        return domain;
    }

    async create(adminId: string, dto: CreateDomainDto) {
        const created = await this.repo.create(adminId, dto);

        this.auditLogger.log({
            adminId,
            action: 'domains:create',
            module: 'domains',
            resource: 'JobDomain',
            resourceId: created.id,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateDomainDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto);

        this.auditLogger.log({
            adminId,
            action: 'domains:update',
            module: 'domains',
            resource: 'JobDomain',
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
            action: 'domains:toggle',
            module: 'domains',
            resource: 'JobDomain',
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

        const roleCount = await this.repo.countRolesUsingDomain(id);
        if (roleCount > 0) {
            throw new ConflictException(
                `Cannot delete — ${roleCount} role(s) still reference this domain. Reassign or remove them first.`,
            );
        }

        await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'domains:delete',
            module: 'domains',
            resource: 'JobDomain',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: 'Job domain deleted' };
    }
}
