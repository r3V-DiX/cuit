// libs/permissions/src/index.ts

export { PermissionsModule } from './permissions.module';
export { PermissionsService, PermissionContext, PermissionResult } from './services/permissions.service';
export { PermissionCacheService } from './services/permission-cache.service';
export { PermissionGuard } from './guards/permission.guard';
export { RequirePermission, PERMISSIONS_KEY } from './decorators/require-permission.decorator';
export { ACTIONS } from './actions.registry';
export type { ActionValue } from './actions.registry';
