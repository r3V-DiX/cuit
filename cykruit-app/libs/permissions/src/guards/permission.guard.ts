// libs/permissions/src/guards/permission.guard.ts
// Route guard that enforces @RequirePermission(...) decorators.
// Reads authenticated user from request (set by AuthGuard from @cykruit/auth-core).
// Reads optional employerId from request.params, request.query, or request.body.

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../services/permissions.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly permissionsService: PermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No @RequirePermission decorator = allow through (AuthGuard handles authentication)
        if (!required || required.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException({ code: 'PERMISSION_DENIED', message: 'Not authenticated.' });
        }

        // Resolve employerId from route params, query, or body — whichever has it
        const employerId: string | undefined =
            request.params?.employerId ??
            request.query?.employerId ??
            request.body?.employerId;

        const ctx = {
            userId: user.id,
            userRole: user.role as UserRole,
            employerId,
        };

        // All required permissions must be granted (AND semantics)
        for (const action of required) {
            const result = await this.permissionsService.check(ctx, action);
            if (result === 'DENIED') {
                throw new ForbiddenException({
                    code: 'PERMISSION_DENIED',
                    message: `Missing permission: ${action}`,
                    action,
                });
            }
        }

        return true;
    }
}
