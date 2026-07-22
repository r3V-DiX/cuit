// admin-app/src/modules/announcements/announcements.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AnnouncementsRepository } from './announcements.repository';
import { AdminAuditLogger } from '../../common';
import { AnnouncementListQueryDto, CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcements.dto';

@Injectable()
export class AnnouncementsService {
    constructor(
        private readonly repo: AnnouncementsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: AnnouncementListQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const announcement = await this.repo.findById(id);
        if (!announcement) throw new NotFoundException('Announcement not found');
        return announcement;
    }

    async create(adminId: string, dto: CreateAnnouncementDto) {
        const created = await this.repo.create(adminId, dto);

        this.auditLogger.log({
            adminId,
            action: 'announcements:create',
            module: 'announcements',
            resource: 'Announcement',
            resourceId: created.id,
            newData: dto as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateAnnouncementDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.update(id, dto);

        this.auditLogger.log({
            adminId,
            action: 'announcements:update',
            module: 'announcements',
            resource: 'Announcement',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            newData: dto as unknown as Prisma.InputJsonValue,
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
            action: 'announcements:delete',
            module: 'announcements',
            resource: 'Announcement',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return { message: 'Announcement deleted' };
    }

    async toggle(adminId: string, id: string) {
        const existing = await this.getById(id);
        const updated = await this.repo.setActive(id, !existing.isActive);

        this.auditLogger.log({
            adminId,
            action: 'announcements:toggle',
            module: 'announcements',
            resource: 'Announcement',
            resourceId: id,
            oldData: { isActive: existing.isActive } as unknown as Prisma.InputJsonValue,
            newData: { isActive: updated.isActive } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
