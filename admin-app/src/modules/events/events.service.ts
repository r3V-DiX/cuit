// admin-app/src/modules/events/events.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { EventsRepository } from './events.repository';
import { AdminAuditLogger } from '../../common';
import {
    AdminEventsQueryDto,
    CreateEventDto,
    UpdateEventDto,
} from './dto/events.dto';

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

@Injectable()
export class EventsService {
    constructor(
        private readonly repo: EventsRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: AdminEventsQueryDto) {
        return this.repo.findAll(query);
    }

    async getById(id: string) {
        const event = await this.repo.findById(id);
        if (!event) throw new NotFoundException('Event not found');
        return event;
    }

    private async resolveUniqueSlug(rawSlug: string, excludeId?: string): Promise<string> {
        let baseSlug = slugify(rawSlug);
        if (!baseSlug) {
            baseSlug = `event-${Date.now()}`;
        }

        let candidateSlug = baseSlug;
        let counter = 1;

        while (true) {
            const existing = await this.repo.findBySlug(candidateSlug);
            if (!existing || (excludeId && existing.id === excludeId)) {
                return candidateSlug;
            }
            candidateSlug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    async create(adminId: string, dto: CreateEventDto) {
        const initialSlug = dto.slug ? dto.slug : dto.title;
        const resolvedSlug = await this.resolveUniqueSlug(initialSlug);

        const created = await this.repo.create({
            ...dto,
            slug: resolvedSlug,
        });

        this.auditLogger.log({
            adminId,
            action: 'events:create',
            module: 'events',
            resource: 'Event',
            resourceId: created.id,
            newData: created as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return created;
    }

    async update(adminId: string, id: string, dto: UpdateEventDto) {
        const existing = await this.getById(id);

        let resolvedSlug = dto.slug;
        if (dto.slug && dto.slug !== existing.slug) {
            resolvedSlug = await this.resolveUniqueSlug(dto.slug, id);
        } else if (dto.title && !dto.slug && !existing.slug) {
            resolvedSlug = await this.resolveUniqueSlug(dto.title, id);
        }

        const payload: UpdateEventDto = {
            ...dto,
            ...(resolvedSlug ? { slug: resolvedSlug } : {}),
        };

        const updated = await this.repo.update(id, payload);

        this.auditLogger.log({
            adminId,
            action: 'events:update',
            module: 'events',
            resource: 'Event',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            newData: updated as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async delete(adminId: string, id: string) {
        const existing = await this.getById(id);
        const deleted = await this.repo.delete(id);

        this.auditLogger.log({
            adminId,
            action: 'events:delete',
            module: 'events',
            resource: 'Event',
            resourceId: id,
            oldData: existing as unknown as Prisma.InputJsonValue,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return deleted;
    }

    async publish(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setPublished(id, true);

        this.auditLogger.log({
            adminId,
            action: 'events:publish',
            module: 'events',
            resource: 'Event',
            resourceId: id,
            newData: { isPublished: true },
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }

    async unpublish(adminId: string, id: string) {
        await this.getById(id);
        const updated = await this.repo.setPublished(id, false);

        this.auditLogger.log({
            adminId,
            action: 'events:unpublish',
            module: 'events',
            resource: 'Event',
            resourceId: id,
            newData: { isPublished: false },
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
