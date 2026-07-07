// admin-app/src/admin/controllers/audit.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import { AuditQueryService } from '../services/audit.service';
import { AuditLogQueryDto } from '../dto/audit.dto';

@Controller('admin/audit-logs')
@UseGuards(AuthGuard, AdminGuard)
export class AuditController {
    constructor(private readonly auditQueryService: AuditQueryService) {}

    @Get()
    list(@Query() query: AuditLogQueryDto) {
        return this.auditQueryService.list(query);
    }
}
