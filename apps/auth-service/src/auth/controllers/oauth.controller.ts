// apps/auth-service/src/auth/controllers/oauth.controller.ts
// FIXES APPLIED:
//   [6] Google and GitHub callbacks now set the CSRF cookie after login
//       Previously only the session cookie was set — any authenticated request after
//       OAuth login (POST /auth/logout, PATCH /auth/change-password etc.) would get
//       403 CSRF_TOKEN_MISSING because the csrf_token cookie was never created
//   [5] Injects CsrfGuard to call generateToken() — same fix as auth.controller.ts

import {
    Controller,
    Get,
    Query,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GoogleOAuthService } from '../services/oauth/google-oauth.service';
import { GitHubOAuthService } from '../services/oauth/github-oauth.service';
import { CsrfGuard, Public } from '@cykruit/auth-core';
import { CookieConfig } from '@cykruit/config';
import { AppLogger } from '@cykruit/logger';
import { UserRole } from '@prisma/client';
import { sanitizeIpAddress } from '../utils/auth.utils';
import { ErrorCodes } from '@cykruit/common';
import { OAuthRateLimit } from '@cykruit/rate-limit';

@Controller('auth')
export class OAuthController {
    constructor(
        private readonly googleOAuthService: GoogleOAuthService,
        private readonly githubOAuthService: GitHubOAuthService,
        // FIX [6] + [5]: Inject CsrfGuard to generate CSRF token on OAuth login
        private readonly csrfGuard: CsrfGuard,
        private readonly logger: AppLogger,
    ) { }

    // ── Google ──────────────────────────────────────────────────

    @Public()
    @OAuthRateLimit()
    @Get('google')
    @HttpCode(HttpStatus.OK)
    async googleAuth(@Query('role') roleParam?: string) {
        try {
            const role = this.parseRole(roleParam);
            const { url } = await this.googleOAuthService.getAuthorizationUrl(role);
            this.logger.log(`Google OAuth URL generated for role: ${role}`, 'OAuthController');
            return { data: { url, provider: 'google' }, message: 'Google OAuth URL generated' };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException({
                code: ErrorCodes.OAUTH_INIT_FAILED,
                message: 'Failed to initialize Google OAuth. Please try again.',
            });
        }
    }

    @Public()
    @Get('google/callback')
    async googleCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        if (!code || !state) {
            return res.redirect(`${appUrl}/login?error=oauth_params_missing`);
        }

        try {
            const ipAddress = sanitizeIpAddress(req.ip || req.socket.remoteAddress);
            const userAgent = req.headers['user-agent'];
            const result = await this.googleOAuthService.handleCallback(code, state, ipAddress, userAgent);

            // Session cookie
            res.cookie(
                CookieConfig.COOKIE_NAMES.SESSION,
                result.sessionToken,
                CookieConfig.getSessionCookieOptions(false),
            );

            // FIX [6]: Set CSRF cookie — was missing, caused 403 on all subsequent mutating requests
            res.cookie(
                CookieConfig.COOKIE_NAMES.CSRF,
                this.csrfGuard.generateToken(),
                CookieConfig.getCsrfCookieOptions(),
            );

            this.logger.log(`Google OAuth successful: ${result.user.email}`, 'OAuthController');
            return res.redirect(`${appUrl}/auth/callback`);
        } catch (error) {
            this.logger.error(`Google OAuth failed: ${error.message}`, error.stack, 'OAuthController');
            const errorCode = error.code || ErrorCodes.GOOGLE_AUTH_FAILED;
            return res.redirect(`${appUrl}/login?error=${errorCode}`);
        }
    }

    // ── GitHub ──────────────────────────────────────────────────

    @Public()
    @OAuthRateLimit()
    @Get('github')
    @HttpCode(HttpStatus.OK)
    async githubAuth(@Query('role') roleParam?: string) {
        try {
            const role = this.parseRole(roleParam);
            const { url } = await this.githubOAuthService.getAuthorizationUrl(role);
            this.logger.log(`GitHub OAuth URL generated for role: ${role}`, 'OAuthController');
            return { data: { url, provider: 'github' }, message: 'GitHub OAuth URL generated' };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException({
                code: ErrorCodes.OAUTH_INIT_FAILED,
                message: 'Failed to initialize GitHub OAuth. Please try again.',
            });
        }
    }

    @Public()
    @Get('github/callback')
    async githubCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        if (!code || !state) {
            return res.redirect(`${appUrl}/login?error=oauth_params_missing`);
        }

        try {
            const ipAddress = sanitizeIpAddress(req.ip || req.socket.remoteAddress);
            const userAgent = req.headers['user-agent'];
            const result = await this.githubOAuthService.handleCallback(code, state, ipAddress, userAgent);

            // Session cookie
            res.cookie(
                CookieConfig.COOKIE_NAMES.SESSION,
                result.sessionToken,
                CookieConfig.getSessionCookieOptions(false),
            );

            // FIX [6]: Set CSRF cookie — was missing, caused 403 on all subsequent mutating requests
            res.cookie(
                CookieConfig.COOKIE_NAMES.CSRF,
                this.csrfGuard.generateToken(),
                CookieConfig.getCsrfCookieOptions(),
            );

            this.logger.log(`GitHub OAuth successful: ${result.user.email}`, 'OAuthController');
            return res.redirect(`${appUrl}/auth/callback`);
        } catch (error) {
            this.logger.error(`GitHub OAuth failed: ${error.message}`, error.stack, 'OAuthController');
            const errorCode = error.code || ErrorCodes.GITHUB_AUTH_FAILED;
            return res.redirect(`${appUrl}/login?error=${errorCode}`);
        }
    }

    // ── Helpers ─────────────────────────────────────────────────

    private parseRole(roleParam?: string): UserRole {
        if (!roleParam) return UserRole.SEEKER;
        const upper = roleParam.toUpperCase();
        if (upper === 'SEEKER' || upper === 'EMPLOYER') return upper as UserRole;
        throw new BadRequestException({
            code: ErrorCodes.OAUTH_INVALID_ROLE,
            message: 'Invalid role. Must be SEEKER or EMPLOYER',
        });
    }
}