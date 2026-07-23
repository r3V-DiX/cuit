// admin-app/src/admin/auth/admin-auth.controller.ts
// POST /admin/auth/login — @Public (throttled): no session exists yet, so it is
// exempt from the app-wide CsrfGuard; it sets the HttpOnly session cookie plus a
// readable csrf_token cookie that the UI echoes back as x-csrf-token on mutations.
// POST /admin/auth/logout — requires a valid session; revokes it + clears cookies.

import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LoginRateLimit } from '@cykruit/rate-limit';
import { CsrfGuard, Public } from '@cykruit/auth-core';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard, ADMIN_SESSION_COOKIE } from './admin-auth.guard';
import { AdminLoginDto } from './dto/admin-login.dto';

export const CSRF_COOKIE = 'admin_csrf_token';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly configService: ConfigService,
        private readonly csrfGuard: CsrfGuard,
    ) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @LoginRateLimit()
    async login(
        @Body() dto: AdminLoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { admin, rawToken, expiresAt } = await this.adminAuthService.login(
            dto,
            req.ip,
            req.headers['user-agent'],
        );

        const isProduction =
            this.configService.get<string>('NODE_ENV') === 'production';

        res.cookie(ADMIN_SESSION_COOKIE, rawToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            expires: expiresAt,
        });

        // Readable by the UI (not HttpOnly) so it can send x-csrf-token on mutations
        res.cookie(CSRF_COOKIE, this.csrfGuard.generateToken(), {
            httpOnly: false,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            expires: expiresAt,
        });

        return { admin };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AdminAuthGuard)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const cookies = req.cookies as Record<string, string | undefined> | undefined;
        const rawToken = cookies?.[ADMIN_SESSION_COOKIE];
        if (rawToken) {
            await this.adminAuthService.logout(rawToken, req.ip, req.headers['user-agent']);
        }

        res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
        res.clearCookie(CSRF_COOKIE, { path: '/' });
        return { message: 'Logged out' };
    }
}
