// admin-app/src/admin/controllers/rbac.controller.ts
// Console RBAC — roles/permissions/assignments/overrides for Admin accounts.

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
import type { Admin } from '@prisma/client';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { RbacService } from './rbac.service';
import {
    CreateRoleDto,
    UpdateRoleDto,
    AssignRolePermissionsDto,
    AssignAdminRoleDto,
    OverrideAdminPermissionDto,
    RbacListQueryDto,
} from './dto/rbac.dto';

@Controller('admin/rbac')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class RbacController {
    constructor(private readonly rbacService: RbacService) {}

    // ── Roles ─────────────────────────────────────────────────────────────────

    @Get('roles')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    listRoles(@Query() _query: RbacListQueryDto) {
        return this.rbacService.listRoles();
    }

    @Get('roles/:id')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    getRole(@Param('id') id: string) {
        return this.rbacService.getRole(id);
    }

    @Post('roles')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    createRole(@CurrentAdmin() admin: Admin, @Body() dto: CreateRoleDto) {
        return this.rbacService.createRole(admin.id, dto);
    }

    @Patch('roles/:id')
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    updateRole(
        @CurrentAdmin() admin: Admin,
        @Param('id') id: string,
        @Body() dto: UpdateRoleDto,
    ) {
        return this.rbacService.updateRole(id, admin.id, dto);
    }

    @Patch('roles/:id/permissions')
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    setRolePermissions(
        @CurrentAdmin() admin: Admin,
        @Param('id') roleId: string,
        @Body() dto: AssignRolePermissionsDto,
    ) {
        return this.rbacService.setRolePermissions(roleId, admin.id, dto);
    }

    @Delete('roles/:id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    deleteRole(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.rbacService.deleteRole(id, admin.id);
    }

    // ── Permissions ───────────────────────────────────────────────────────────

    @Get('permissions')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    listPermissions() {
        return this.rbacService.listPermissions();
    }

    // ── Admin accounts ────────────────────────────────────────────────────────

    @Get('admins')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    listAdmins() {
        return this.rbacService.listAdmins();
    }

    // ── Admin role assignments ────────────────────────────────────────────────

    @Post('admin-roles')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    assignAdminRole(@CurrentAdmin() admin: Admin, @Body() dto: AssignAdminRoleDto) {
        return this.rbacService.assignAdminRole(admin.id, dto);
    }

    @Delete('admin-roles/:id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    revokeAdminRole(@CurrentAdmin() admin: Admin, @Param('id') assignmentId: string) {
        return this.rbacService.revokeAdminRole(assignmentId, admin.id);
    }

    @Get('admins/:adminId')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    getAdminSummary(@Param('adminId') adminId: string) {
        return this.rbacService.getAdminSummary(adminId);
    }

    @Get('admins/:adminId/roles')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    getAdminRoles(@Param('adminId') adminId: string) {
        return this.rbacService.getAdminRoles(adminId);
    }

    // ── Admin permission overrides ────────────────────────────────────────────

    @Post('permission-overrides')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    overridePermission(@CurrentAdmin() admin: Admin, @Body() dto: OverrideAdminPermissionDto) {
        return this.rbacService.overrideAdminPermission(admin.id, dto);
    }

    @Get('admins/:adminId/permission-overrides')
    @RequirePermission(ACTIONS.RBAC.VIEW)
    getAdminPermissionOverrides(@Param('adminId') adminId: string) {
        return this.rbacService.getAdminPermissionOverrides(adminId);
    }

    @Delete('permission-overrides/:id')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.RBAC.MANAGE)
    deletePermissionOverride(@CurrentAdmin() admin: Admin, @Param('id') id: string) {
        return this.rbacService.deleteAdminPermissionOverride(id, admin.id);
    }
}
