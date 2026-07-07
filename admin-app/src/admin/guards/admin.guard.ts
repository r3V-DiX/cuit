// admin-app/src/admin/guards/admin.guard.ts

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * AdminGuard extends AuthGuard's session check — it adds a role assertion
 * so only users with role === ADMIN can reach admin endpoints.
 *
 * Usage: apply alongside AuthGuard, or replace it (AuthGuard runs first via
 * the module's AuthCoreModule.forRoot which populates req.user).
 */
@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const user = req.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
