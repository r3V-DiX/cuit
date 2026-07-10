// admin-app/src/admin/services/audit.service.ts

import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';
import { AdminActivityLogQueryDto, UnifiedAuthLogQueryDto, SystemAuditLogQueryDto } from '../dto/audit.dto';

@Injectable()
export class AuditQueryService {
    constructor(private readonly auditRepository: AuditRepository) {}

    async listAdminActivity(query: AdminActivityLogQueryDto) {
        return this.auditRepository.findAdminActivityLogs(query);
    }

    async listUnifiedAuth(query: UnifiedAuthLogQueryDto) {
        return this.auditRepository.findUnifiedAuthLogs(query);
    }

    async listSystemLogs(query: SystemAuditLogQueryDto) {
        return this.auditRepository.findSystemLogs(query);
    }
}
