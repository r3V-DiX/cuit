// admin-app/src/modules/blacklist/blacklist.service.ts

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { invalidateBlacklistCache } from '@cykruit/blacklist';
import { BlacklistRepository } from './blacklist.repository';
import { AdminAuditLogger } from '../../common';
import { BlacklistEntryDto, BlacklistListQueryDto, BulkCreateBlacklistDto } from './dto/blacklist.dto';

@Injectable()
export class BlacklistService {
    constructor(
        private readonly repo: BlacklistRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: BlacklistListQueryDto) {
        return this.repo.findAll(query);
    }

    async create(adminId: string, dto: BlacklistEntryDto) {
        const created = await this.repo.create(adminId, dto).catch((err: unknown) => {
            if ((err as { code?: string })?.code === 'P2002') {
                throw new ConflictException('This value is already blacklisted');
            }
            throw err;
        });

        await invalidateBlacklistCache();

        this.auditLogger.log({
            adminId,
            action: 'blacklist:create',
            module: 'blacklist',
            resource: 'Blacklist',
            resourceId: created.id,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return created;
    }

    async bulkCreate(adminId: string, dto: BulkCreateBlacklistDto) {
        const result = await this.repo.bulkCreate(adminId, dto.entries);
        await invalidateBlacklistCache();

        this.auditLogger.log({
            adminId,
            action: 'blacklist:bulk-create',
            module: 'blacklist',
            resource: 'Blacklist',
            newData: { count: dto.entries.length } as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: `${result.count} entries added (duplicates skipped)`, count: result.count };
    }

    async delete(adminId: string, id: string) {
        const existing = await this.repo.findById(id);
        if (!existing) throw new NotFoundException('Blacklist entry not found');

        await this.repo.delete(id);
        await invalidateBlacklistCache();

        this.auditLogger.log({
            adminId,
            action: 'blacklist:delete',
            module: 'blacklist',
            resource: 'Blacklist',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: 'Blacklist entry removed' };
    }
}
