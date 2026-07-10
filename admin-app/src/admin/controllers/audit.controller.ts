// admin-app/src/admin/controllers/audit.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { ACTIONS } from '../rbac/permissions.registry';
import { AuditQueryService } from '../services/audit.service';
import { AuditLogQueryDto, AuthAuditLogQueryDto } from '../dto/audit.dto';

@Controller('admin/audit-logs')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AuditController {
    constructor(private readonly auditQueryService: AuditQueryService) {}

    @Get('system')
    @RequirePermission(ACTIONS.AUDIT.VIEW)
    listSystem(@Query() query: AuditLogQueryDto) {
        return this.auditQueryService.list(query);
    }

    @Get('auth')
    @RequirePermission(ACTIONS.AUDIT.VIEW)
    listAuth(@Query() query: AuthAuditLogQueryDto) {
        return this.auditQueryService.listAuthLogs(query);
    }

    @Get()
    @RequirePermission(ACTIONS.AUDIT.VIEW)
    list(@Query() query: AuditLogQueryDto) {
        return this.auditQueryService.list(query);
    }
}
