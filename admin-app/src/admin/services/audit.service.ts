// admin-app/src/admin/services/audit.service.ts

import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditLogQueryDto, AuthAuditLogQueryDto } from '../dto/audit.dto';

@Injectable()
export class AuditQueryService {
    constructor(private readonly auditRepository: AuditRepository) {}

    async list(query: AuditLogQueryDto) {
        return this.auditRepository.findAll(query);
    }

    async listAuthLogs(query: AuthAuditLogQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const { items, total } = await this.auditRepository.findAuthLogs(query);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}
