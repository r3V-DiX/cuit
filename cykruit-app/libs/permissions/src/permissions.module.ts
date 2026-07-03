// libs/permissions/src/permissions.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from '@cykruit/prisma';
import { PermissionsService } from './services/permissions.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { PermissionGuard } from './guards/permission.guard';

@Module({
    imports: [PrismaModule],
    providers: [PermissionsService, PermissionCacheService, PermissionGuard],
    exports: [PermissionsService, PermissionCacheService, PermissionGuard],
})
export class PermissionsModule {}
