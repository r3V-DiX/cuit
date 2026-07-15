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
import type { Request } from 'express';
import type { Admin } from '@prisma/client';
import { AdminAuthService } from './admin-auth.service';

export const ADMIN_SESSION_COOKIE = 'admin_session_token';

export type AdminRequest = Request & { admin?: Admin };

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(private readonly adminAuthService: AdminAuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<AdminRequest>();

        const rawToken = this.extractToken(req);
        if (!rawToken) {
            throw new UnauthorizedException('Authentication required');
        }

        req.admin = await this.adminAuthService.validateSession(rawToken);
        return true;
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
