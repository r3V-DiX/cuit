// admin-app/src/admin/controllers/rbac.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { AdminGuard } from '../guards/admin.guard';
import type { User } from '@prisma/client';
import { RbacService } from '../services/rbac.service';
import {
    CreateRoleDto,
    UpdateRoleDto,
    AssignRolePermissionsDto,
    AssignUserRoleDto,
    OverrideUserPermissionDto,
    RbacListQueryDto,
} from '../dto/rbac.dto';

@Controller('admin/rbac')
@UseGuards(AuthGuard, AdminGuard)
export class RbacController {
    constructor(private readonly rbacService: RbacService) {}

    // ── Roles ─────────────────────────────────────────────────────────────────

    @Get('roles')
    listRoles(@Query() _query: RbacListQueryDto) {
        return this.rbacService.listRoles();
    }

    @Get('roles/:id')
    getRole(@Param('id') id: string) {
        return this.rbacService.getRole(id);
    }

    @Post('roles')
    @HttpCode(HttpStatus.CREATED)
    createRole(@CurrentUser() admin: User, @Body() dto: CreateRoleDto) {
        return this.rbacService.createRole(admin.id, dto);
    }

    @Patch('roles/:id')
    updateRole(
        @CurrentUser() admin: User,
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
    ) {
        return this.rbacService.updateRole(id, admin.id, dto);
    }

    @Patch('roles/:id/permissions')
    setRolePermissions(
        @CurrentUser() admin: User,
        @Param('id') roleId: string,
        @Body() dto: AssignRolePermissionsDto,
    ) {
        return this.rbacService.setRolePermissions(roleId, admin.id, dto);
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    @Get('permissions')
    listPermissions() {
        return this.rbacService.listPermissions();
    }

    // ── User role assignments ─────────────────────────────────────────────────

    @Post('user-roles')
    @HttpCode(HttpStatus.CREATED)
    assignUserRole(@CurrentUser() admin: User, @Body() dto: AssignUserRoleDto) {
        return this.rbacService.assignUserRole(admin.id, dto);
    }

    @Delete('user-roles/:id')
    @HttpCode(HttpStatus.OK)
    revokeUserRole(@CurrentUser() admin: User, @Param('id') assignmentId: string) {
        return this.rbacService.revokeUserRole(assignmentId, admin.id);
    }

    @Get('users/:userId/roles')
    getUserRoles(@Param('userId') userId: string) {
        return this.rbacService.getUserRoles(userId);
    }

    // ── Permission overrides ──────────────────────────────────────────────────

    @Post('permission-overrides')
    @HttpCode(HttpStatus.CREATED)
    overridePermission(@CurrentUser() admin: User, @Body() dto: OverrideUserPermissionDto) {
        return this.rbacService.overrideUserPermission(admin.id, dto);
    }

    @Get('users/:userId/permission-overrides')
    getUserPermissionOverrides(@Param('userId') userId: string) {
        return this.rbacService.getUserPermissionOverrides(userId);
    }
}
