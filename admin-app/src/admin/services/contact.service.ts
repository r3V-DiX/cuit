// admin-app/src/admin/services/contact.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ContactRepository } from '../repositories/contact.repository';
import { AdminAuditLogger } from './admin-audit.logger';
import { ContactListQueryDto, UpdateContactStatusDto } from '../dto/contact.dto';

@Injectable()
export class ContactService {
    constructor(
        private readonly repo: ContactRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    list(query: ContactListQueryDto) {
        return this.repo.list(query);
    }

    async getById(id: string) {
        const contact = await this.repo.getById(id);
        if (!contact) throw new NotFoundException('Contact form submission not found');
        return contact;
    }

    async updateStatus(adminId: string, id: string, dto: UpdateContactStatusDto) {
        const existing = await this.getById(id);
        const updated = await this.repo.updateStatus(id, dto.status, adminId, dto.notes);

        this.auditLogger.log({
            adminId,
            action: 'contact:update-status',
            module: 'contact',
            resource: 'ContactForm',
            resourceId: id,
            oldData: { status: existing.status } as unknown as Prisma.InputJsonValue,
            newData: { status: dto.status } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return updated;
    }
}
