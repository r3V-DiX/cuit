// admin-app/src/modules/admin-notifications/admin-notification.controller.ts
// Each admin's own personal notification inbox — no @RequirePermission on
// either route, deliberately: this isn't an org-wide manageable resource,
// just like GET /admin/me needs only a valid session (see PermissionsGuard's
// own doc comment). AdminAuthGuard + PermissionsGuard are still applied at
// class level for consistency with every other admin-app controller.

import { Controller, Get, Patch, Param, Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { AdminAuthGuard, CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import type { Admin } from '@prisma/client';
import { AdminNotificationService } from './admin-notification.service';
import { ListAdminNotificationsDto } from './dto/admin-notification.dto';

@Controller('admin/notifications')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminNotificationController {
    constructor(private readonly service: AdminNotificationService) {}

    @Get()
    list(@CurrentAdmin() admin: Admin, @Query() query: ListAdminNotificationsDto) {
        return this.service.list(admin.id, query);
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    markRead(@CurrentAdmin() admin: Admin, @Param('id', ParseUUIDPipe) id: string) {
        return this.service.markRead(id, admin.id);
    }
}
