// admin-app/src/admin/controllers/admin-invite-accept.controller.ts
// Public endpoint — no admin session exists yet when someone is accepting an
// invite. Kept on its own guard-free controller (never merged into
// AdminsController) so a future change to that controller's @UseGuards can't
// accidentally lock this route down.

import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CsrfGuard, Public } from '@cykruit/auth-core';
import { AdminsService } from '../services/admins.service';
import { AcceptInviteDto } from '../dto/admins.dto';
import { ADMIN_SESSION_COOKIE } from '../auth/admin-auth.guard';
import { CSRF_COOKIE } from '../auth/admin-auth.controller';

@Controller('admin/admins/invite')
export class AdminInviteAcceptController {
    constructor(
        private readonly adminsService: AdminsService,
        private readonly configService: ConfigService,
        private readonly csrfGuard: CsrfGuard,
    ) {}

    // POST /admin/admins/invite/accept
    @Public()
    @Post('accept')
    @HttpCode(HttpStatus.OK)
    async accept(
        @Body() dto: AcceptInviteDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { admin, rawToken, expiresAt } = await this.adminsService.acceptInvite(
            dto,
            req.ip,
            req.headers['user-agent'],
        );

        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        res.cookie(ADMIN_SESSION_COOKIE, rawToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            expires: expiresAt,
        });

        res.cookie(CSRF_COOKIE, this.csrfGuard.generateToken(), {
            httpOnly: false,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            expires: expiresAt,
        });

        return { admin };
    }
}
