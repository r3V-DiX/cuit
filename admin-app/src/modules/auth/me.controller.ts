// admin-app/src/admin/controllers/me.controller.ts
// Identity + resolved RBAC permissions for the admin UI's gating
// (docs/admin-ui/BACKEND-SCHEMA-admin-ui.md §4.1). No @RequirePermission —
// every authenticated admin may read their own permission set.

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Admin } from '@prisma/client';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { AdminAuthGuard, type AdminRequest } from './admin-auth.guard';
import { CurrentAdmin } from './current-admin.decorator';
import { PermissionsService } from '../../common';

@Controller('admin/me')
@UseGuards(AdminAuthGuard)
export class MeController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Get()
    @SkipRateLimit({ global: true })
    async me(@CurrentAdmin() admin: Admin, @Req() req: AdminRequest) {
        const resolved = await this.permissionsService.resolveUserPermissions(admin.id);

        return {
            user: {
                id: admin.id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
            },
            roles: resolved.roles,
            isSuperAdmin: resolved.isSuperAdmin,
            permissions: [...resolved.permissions].sort(),
            sessionExpiresAt: req.sessionExpiresAt,
        };
    }
}
