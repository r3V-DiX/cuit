// admin-app/src/admin/decorators/require-permission.decorator.ts

import { SetMetadata } from '@nestjs/common';
import type { Action } from '../rbac/permissions.registry';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/**
 * Declares the RBAC permission a route needs. Read by PermissionsGuard.
 * Usage: @RequirePermission(ACTIONS.KYC.REVIEW)
 */
export const RequirePermission = (action: Action) =>
    SetMetadata(REQUIRE_PERMISSION_KEY, action);
