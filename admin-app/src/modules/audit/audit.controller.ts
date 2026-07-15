// admin-app/src/admin/controllers/audit.controller.ts
// Three endpoints, one per admin-ui audit-logs tab:
//   GET /admin/audit-logs                → Tab 1: Audit Logs (unified auth, AuthAuditLog + AdminAuthAuditLog)
//   GET /admin/audit-logs/system         → Tab 2: System Logs (main app business actions, AuditLog)
//   GET /admin/audit-logs/admin-activity → Tab 3: Admin Activity Logs (console mutations, AdminAuditLog)

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { AuditQueryService } from './audit.service';
import { AdminActivityLogQueryDto, UnifiedAuthLogQueryDto, SystemAuditLogQueryDto } from './dto/audit.dto';

@Controller('admin/audit-logs')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AuditController {
    constructor(private readonly auditQueryService: AuditQueryService) {}

    @Get()
    @RequirePermission(ACTIONS.AUDIT.VIEW)
    listUnifiedAuth(@Query() query: UnifiedAuthLogQueryDto) {
        return this.auditQueryService.listUnifiedAuth(query);
    }

    @Get('system')
    @RequirePermission(ACTIONS.AUDIT.VIEW)
    listSystem(@Query() query: SystemAuditLogQueryDto) {
        return this.auditQueryService.listSystemLogs(query);
    }

    @Get('admin-activity')
    @RequirePermission(ACTIONS.AUDIT.VIEW)
    listAdminActivity(@Query() query: AdminActivityLogQueryDto) {
        return this.auditQueryService.listAdminActivity(query);
    }
}
