// libs/permissions/src/index.ts

export { PermissionsModule } from './permissions.module';
export { PermissionsService, PermissionContext, PermissionResult } from './services/permissions.service';
export { PermissionCacheService } from './services/permission-cache.service';
export { PermissionGuard } from './guards/permission.guard';
export { RequirePermission, PERMISSIONS_KEY } from './decorators/require-permission.decorator';
export { ACTIONS } from './actions.registry';
export type { ActionValue } from './actions.registry';
export {
    EMPLOYER_ACTIONS,
    ALL_EMPLOYER_ACTIONS,
    EMPLOYER_PERMISSION_DESCRIPTIONS,
    DEFAULT_EMPLOYER_ROLE_GRANTS,
    splitEmployerAction,
} from './employer-rbac.registry';
export type { EmployerAction } from './employer-rbac.registry';
