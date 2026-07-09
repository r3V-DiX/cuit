// admin-app/src/admin/controllers/me.controller.ts
// Identity + resolved RBAC permissions for the admin UI's gating
// (docs/admin-ui/BACKEND-SCHEMA-admin-ui.md §4.1). No @RequirePermission —
// every authenticated admin may read their own permission set.

import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Admin } from '@prisma/client';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import { PermissionsService } from '../services/permissions.service';

@Controller('admin/me')
@UseGuards(AdminAuthGuard)
export class MeController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Get()
    async me(@CurrentAdmin() admin: Admin) {
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
        };
    }
}
