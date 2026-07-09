// admin-app/src/admin/auth/admin-auth.controller.ts
// POST /admin/auth/login — public (throttled); sets the HttpOnly session cookie.
// POST /admin/auth/logout — requires a valid session; revokes it + clears cookie.
// No CSRF in v1 (SameSite=Lax + same-origin proxy) — documented trade-off.

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
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard, ADMIN_SESSION_COOKIE } from './admin-auth.guard';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly configService: ConfigService,
    ) {}

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

        res.cookie(ADMIN_SESSION_COOKIE, rawToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: this.configService.get<string>('NODE_ENV') === 'production',
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
            await this.adminAuthService.logout(rawToken);
        }

        res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
        return { message: 'Logged out' };
    }
}
