// libs/permissions/src/decorators/require-permission.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'required_permissions';

// Accepts string so ACTIONS.JOBS.CREATE const values pass without complex narrowing
export const RequirePermission = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
