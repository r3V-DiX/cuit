// admin-app/src/admin/controllers/audit.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import { AuditQueryService } from '../services/audit.service';
import { AuditLogQueryDto, AuthAuditLogQueryDto } from '../dto/audit.dto';

@Controller('admin/audit-logs')
@UseGuards(AuthGuard, AdminGuard)
export class AuditController {
    constructor(private readonly auditQueryService: AuditQueryService) {}

    @Get('system')
    listSystem(@Query() query: AuditLogQueryDto) {
        return this.auditQueryService.list(query);
    }

    @Get('auth')
    listAuth(@Query() query: AuthAuditLogQueryDto) {
        return this.auditQueryService.listAuthLogs(query);
    }

    @Get()
    list(@Query() query: AuditLogQueryDto) {
        return this.auditQueryService.list(query);
    }
}
