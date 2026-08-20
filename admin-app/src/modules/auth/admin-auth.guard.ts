// admin-app/src/admin/auth/admin-auth.guard.ts
// Validates the admin_session_token cookie (or Bearer token) and attaches
// req.admin. Replaces the old AuthGuard + AdminGuard pair — anyone with a valid
// AdminSession IS console staff; granular access is PermissionsGuard's job.

import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Admin } from '@prisma/client';
import { CsrfGuard } from '@cykruit/auth-core';
import { AdminAuthService } from './admin-auth.service';
import { getAdminCsrfCookieOptions, getAdminClearSessionCookieOptions } from './admin-cookie.config';

export const ADMIN_SESSION_COOKIE = 'admin_session_token';
export const CSRF_COOKIE = 'admin_csrf_token';

export type AdminRequest = Request & { admin?: Admin; sessionExpiresAt?: Date };

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(
        private readonly adminAuthService: AdminAuthService,
        private readonly csrfGuard: CsrfGuard,
        private readonly configService: ConfigService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<AdminRequest>();

        const rawToken = this.extractToken(req);
        if (!rawToken) {
            throw new UnauthorizedException('Authentication required');
        }

        const res = context.switchToHttp().getResponse<Response>();
        const nodeEnv = this.configService.get<string>('NODE_ENV');

        try {
            const { admin, expiresAt } = await this.adminAuthService.validateSession(rawToken);
            req.admin = admin;
            req.sessionExpiresAt = expiresAt;

            // Sliding-window CSRF refresh — the signed token's own HMAC expiry stays
            // short, but renewing the cookie on every authenticated request means it
            // never goes stale for an admin whose session cookie outlives it.
            res.cookie(CSRF_COOKIE, this.csrfGuard.generateToken(), getAdminCsrfCookieOptions(nodeEnv));

            return true;
        } catch (error) {
            // A rejected/expired session cookie must never survive a guarded
            // request — otherwise it lingers in the browser until its own
            // expiry even after the admin has explicitly signed out or the
            // session was revoked server-side.
            res.clearCookie(ADMIN_SESSION_COOKIE, getAdminClearSessionCookieOptions(nodeEnv));
            throw error;
        }
    }

    private extractToken(req: AdminRequest): string | undefined {
        const cookies = req.cookies as Record<string, string | undefined> | undefined;
        const fromCookie = cookies?.[ADMIN_SESSION_COOKIE];
        if (fromCookie) return fromCookie;

        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.slice('Bearer '.length);
        }

        return undefined;
    }
}
