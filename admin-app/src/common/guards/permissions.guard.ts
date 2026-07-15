// admin-app/src/admin/guards/permissions.guard.ts
// Runs after AdminAuthGuard (controller-level — NEVER register as APP_GUARD,
// global guards run before auth attaches req.admin). Reads @RequirePermission()
// metadata and delegates to the deny-by-default pipeline. Routes without the
// decorator require only a valid admin session (e.g. GET /admin/me).

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../services/permissions.service';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import type { Action } from '../rbac/permissions.registry';
import type { AdminRequest } from '../../modules/auth/admin-auth.guard';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly permissionsService: PermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const action = this.reflector.getAllAndOverride<Action | undefined>(
            REQUIRE_PERMISSION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!action) return true;

        const req = context.switchToHttp().getRequest<AdminRequest>();
        const admin = req.admin;

        if (!admin) {
            throw new ForbiddenException('Authentication required');
        }

        await this.permissionsService.checkOrThrow(admin.id, action, req.ip);
        return true;
    }
}
