// admin-app/src/common/index.ts — shared barrel consumed by feature modules.

export * from './loggers/admin-audit.logger';
export * from './loggers/admin-auth-audit.logger';
export * from './services/permissions.service';
export * from './guards/permissions.guard';
export * from './decorators/require-permission.decorator';
export * from './decorators/searchable.decorator';
export * from './interfaces/search-entity.interface';
export * from './rbac/permissions.registry';
export * from './rbac/protected-admin.util';
export * from './root-admin-bootstrap.check';
export * from './core.module';
