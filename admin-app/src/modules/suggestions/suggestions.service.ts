// admin-app/src/modules/suggestions/suggestions.service.ts

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { SuggestionsRepository } from './suggestions.repository';
import { AdminAuditLogger } from '../../common';
import {
    BulkCreateSuggestionsDto,
    CreateSuggestionDto,
    SuggestionListQueryDto,
    UpdateSuggestionDto,
} from './dto/suggestions.dto';

@Injectable()
export class SuggestionsService {
    constructor(
        private readonly repo: SuggestionsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: SuggestionListQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const suggestion = await this.repo.findById(id);
        if (!suggestion) throw new NotFoundException('Suggestion not found');
        return suggestion;
    }

    async create(adminId: string, dto: CreateSuggestionDto) {
        const created = await this.repo.create(adminId, dto).catch((err: unknown) => {
            if ((err as { code?: string })?.code === 'P2002') {
                throw new ConflictException('This text/type combination already exists');
            }
            throw err;
        });

        this.auditLogger.log({
            adminId,
            action: 'suggestions:create',
            module: 'suggestions',
            resource: 'SearchSuggestion',
            resourceId: created.id,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async bulkCreate(adminId: string, dto: BulkCreateSuggestionsDto) {
        const result = await this.repo.bulkCreate(adminId, dto.entries);

        this.auditLogger.log({
            adminId,
            action: 'suggestions:bulk-create',
            module: 'suggestions',
            resource: 'SearchSuggestion',
            newData: { count: dto.entries.length } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return { message: `${result.count} suggestions added (duplicates skipped)`, count: result.count };
    }

    async update(adminId: string, id: string, dto: UpdateSuggestionDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto);

        this.auditLogger.log({
            adminId,
            action: 'suggestions:update',
            module: 'suggestions',
            resource: 'SearchSuggestion',
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
            action: 'suggestions:toggle',
            module: 'suggestions',
            resource: 'SearchSuggestion',
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
        await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'suggestions:delete',
            module: 'suggestions',
            resource: 'SearchSuggestion',
            resourceId: id,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return { message: 'Suggestion deleted' };
    }
}
