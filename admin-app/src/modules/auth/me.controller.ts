// admin-app/src/admin/controllers/me.controller.ts
// Identity + resolved RBAC permissions for the admin UI's gating
// (docs/admin-ui/BACKEND-SCHEMA-admin-ui.md §4.1). No @RequirePermission —
// every authenticated admin may read their own permission set.

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Admin } from '@prisma/client';
import type { Response } from 'express';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { AdminAuthGuard, ADMIN_SESSION_COOKIE, type AdminRequest } from './admin-auth.guard';
import { CurrentAdmin } from './current-admin.decorator';
import { AdminAuthService } from './admin-auth.service';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { getAdminClearSessionCookieOptions } from './admin-cookie.config';
import { PermissionsService } from '../../common';

function currentToken(req: AdminRequest): string | undefined {
    return (req.cookies as Record<string, string | undefined> | undefined)?.[ADMIN_SESSION_COOKIE];
}

@Controller('admin/me')
@UseGuards(AdminAuthGuard)
export class MeController {
    constructor(
        private readonly permissionsService: PermissionsService,
        private readonly adminAuthService: AdminAuthService,
        private readonly configService: ConfigService,
    ) {}

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
                phone: admin.phone,
                lastLogin: admin.lastLogin,
                lastLoginIp: admin.lastLoginIp,
            },
            roles: resolved.roles,
            isSuperAdmin: resolved.isSuperAdmin,
            permissions: [...resolved.permissions].sort(),
            sessionExpiresAt: req.sessionExpiresAt,
        };
    }

    // PATCH /admin/me — self-service profile edit, no @RequirePermission: every
    // authenticated admin may update their own name/phone. Email is not editable
    // here — it's the OTP-login identity, changing it is a separate decision.
    @Patch()
    async updateProfile(@CurrentAdmin() admin: Admin, @Body() dto: UpdateOwnProfileDto) {
        return this.adminAuthService.updateOwnProfile(admin.id, dto);
    }

    // GET /admin/me/sessions — every AdminSession belonging to the current admin
    // (this console has no cross-admin session visibility, only self).
    @Get('sessions')
    async listSessions(@CurrentAdmin() admin: Admin, @Req() req: AdminRequest) {
        return this.adminAuthService.listSessions(admin.id, currentToken(req));
    }

    // DELETE /admin/me/sessions/:id — revokes one of the admin's own sessions.
    // Revoking the session the request itself is using also clears the cookie,
    // matching AdminAuthController.logout's cookie-clear behavior.
    @Delete('sessions/:id')
    @HttpCode(HttpStatus.OK)
    async revokeSession(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Req() req: AdminRequest,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { wasCurrent } = await this.adminAuthService.revokeSession(admin.id, id, currentToken(req));
        if (wasCurrent) {
            const nodeEnv = this.configService.get<string>('NODE_ENV');
            res.clearCookie(ADMIN_SESSION_COOKIE, getAdminClearSessionCookieOptions(nodeEnv));
        }
        return { revoked: true, wasCurrent };
    }
}
