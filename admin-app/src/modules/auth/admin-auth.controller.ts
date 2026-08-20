// admin-app/src/admin/auth/admin-auth.controller.ts

// POST /admin/auth/request-otp — @Public (throttled): emails a 6-digit OTP if the
// address matches an active admin; always returns a generic message.
// POST /admin/auth/verify-otp — @Public (throttled): verifies the OTP and, on
// success, sets the HttpOnly session cookie plus a readable csrf_token cookie
// that the UI echoes back as x-csrf-token on mutations.
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
import { RequestOtpRateLimit, VerifyOtpRateLimit } from '@cykruit/rate-limit';
import { CsrfGuard, Public } from '@cykruit/auth-core';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard, ADMIN_SESSION_COOKIE } from './admin-auth.guard';
import { RequestAdminOtpDto } from './dto/request-admin-otp.dto';
import { VerifyAdminOtpDto } from './dto/verify-admin-otp.dto';
import {
    getAdminSessionCookieOptions,
    getAdminClearSessionCookieOptions,
    getAdminCsrfCookieOptions,
    getAdminClearCsrfCookieOptions,
} from './admin-cookie.config';

export const CSRF_COOKIE = 'admin_csrf_token';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly configService: ConfigService,
        private readonly csrfGuard: CsrfGuard,
    ) {}

    @Public()
    @Post('request-otp')
    @HttpCode(HttpStatus.OK)
    @RequestOtpRateLimit()
    async requestOtp(
        @Body() dto: RequestAdminOtpDto,
        @Req() req: Request,
    ) {
        return this.adminAuthService.requestOtp(dto, req.ip, req.headers['user-agent']);
    }

    @Public()
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @VerifyOtpRateLimit()
    async verifyOtp(
        @Body() dto: VerifyAdminOtpDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { admin, rawToken, expiresAt } = await this.adminAuthService.verifyOtp(
            dto,
            req.ip,
            req.headers['user-agent'],
        );

        const nodeEnv = this.configService.get<string>('NODE_ENV');

        res.cookie(ADMIN_SESSION_COOKIE, rawToken, getAdminSessionCookieOptions(nodeEnv, expiresAt));

        // Readable by the UI (not HttpOnly) so it can send x-csrf-token on mutations
        res.cookie(CSRF_COOKIE, this.csrfGuard.generateToken(), getAdminCsrfCookieOptions(nodeEnv, expiresAt));

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

        const nodeEnv = this.configService.get<string>('NODE_ENV');
        res.clearCookie(ADMIN_SESSION_COOKIE, getAdminClearSessionCookieOptions(nodeEnv));
        res.clearCookie(CSRF_COOKIE, getAdminClearCsrfCookieOptions(nodeEnv));
        return { message: 'Logged out' };
    }
}
