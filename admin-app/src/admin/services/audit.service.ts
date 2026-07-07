// admin-app/src/admin/services/audit.service.ts

import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditLogQueryDto } from '../dto/audit.dto';

@Injectable()
export class AuditQueryService {
    constructor(private readonly auditRepository: AuditRepository) {}

    async list(query: AuditLogQueryDto) {
        return this.auditRepository.findAll(query);
    }
}
