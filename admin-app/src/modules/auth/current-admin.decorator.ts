// admin-app/src/admin/auth/current-admin.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Admin } from '@prisma/client';
import type { AdminRequest } from './admin-auth.guard';

/** The Admin attached by AdminAuthGuard. Only valid on guarded routes. */
export const CurrentAdmin = createParamDecorator(
    (_data: unknown, context: ExecutionContext): Admin | undefined => {
        const req = context.switchToHttp().getRequest<AdminRequest>();
        return req.admin;
    },
);
