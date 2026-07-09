// admin-app/src/admin/services/rbac.service.ts
// Console RBAC management. System roles (super_admin / platform_admin / reviewer)
// are seed-owned: no rename, no deactivation, and super_admin's permission set is locked.

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RbacRepository } from '../repositories/rbac.repository';
import {
    CreateRoleDto,
    UpdateRoleDto,
    AssignRolePermissionsDto,
    AssignAdminRoleDto,
    OverrideAdminPermissionDto,
} from '../dto/rbac.dto';
import { AdminAuditLogger } from './admin-audit.logger';
import { PermissionsService } from './permissions.service';
import { SYSTEM_ROLE_NAMES, SUPER_ADMIN_ROLE } from '../rbac/permissions.registry';

@Injectable()
export class RbacService {
    constructor(
        private readonly rbacRepository: RbacRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly permissionsService: PermissionsService,
    ) {}

    async listRoles() {
        return this.rbacRepository.findAllRoles();
    }

    async getRole(id: string) {
        const role = await this.rbacRepository.findRoleById(id);
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async createRole(actingAdminId: string, dto: CreateRoleDto) {
        if (SYSTEM_ROLE_NAMES.includes(dto.name)) {
            throw new ForbiddenException('This role name is reserved for system roles');
        }

        const role = await this.rbacRepository.createRole(dto);

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'AdminRbacRole',
            resourceId: role.id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { name: dto.name },
        });

        return role;
    }

    async updateRole(id: string, actingAdminId: string, dto: UpdateRoleDto) {
        const role = await this.getRole(id);

        if (SYSTEM_ROLE_NAMES.includes(role.name)) {
            if (dto.name !== undefined && dto.name !== role.name) {
                throw new ForbiddenException('System roles cannot be renamed');
            }
            if (dto.isActive === false) {
                throw new ForbiddenException('System roles cannot be deactivated');
            }
        }

        const updated = await this.rbacRepository.updateRole(id, dto);
        this.permissionsService.clearCache();

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'AdminRbacRole',
            resourceId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return updated;
    }

    async setRolePermissions(roleId: string, actingAdminId: string, dto: AssignRolePermissionsDto) {
        const role = await this.getRole(roleId);

        if (role.name === SUPER_ADMIN_ROLE) {
            throw new ForbiddenException("super_admin's permissions cannot be edited");
        }

        const updated = await this.rbacRepository.setRolePermissions(roleId, dto.permissionIds);
        this.permissionsService.clearCache();

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'AdminRbacRole',
            resourceId: roleId,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return updated;
    }

    async listPermissions() {
        return this.rbacRepository.findAllPermissions();
    }

    async listAdmins() {
        return this.rbacRepository.findAllAdmins();
    }

    async assignAdminRole(actingAdminId: string, dto: AssignAdminRoleDto) {
        const assignment = await this.rbacRepository.assignAdminRole(
            dto.adminId,
            dto.roleId,
            actingAdminId,
            dto.expiresAt,
        );
        this.permissionsService.clearCache(dto.adminId);

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'Admin',
            resourceId: dto.adminId,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { roleId: dto.roleId },
        });

        return assignment;
    }

    async revokeAdminRole(assignmentId: string, actingAdminId: string) {
        const revoked = await this.rbacRepository.revokeAdminRole(assignmentId);
        this.permissionsService.clearCache(revoked.adminId);

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'AdminRoleAssignment',
            resourceId: assignmentId,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return revoked;
    }

    async getAdminRoles(adminId: string) {
        return this.rbacRepository.findAdminRoles(adminId);
    }

    async overrideAdminPermission(actingAdminId: string, dto: OverrideAdminPermissionDto) {
        const override = await this.rbacRepository.overrideAdminPermission(
            dto.adminId,
            dto.permissionId,
            dto.grant,
            actingAdminId,
            dto.reason,
        );
        this.permissionsService.clearCache(dto.adminId);

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'Admin',
            resourceId: dto.adminId,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
            newData: { permissionId: dto.permissionId, grant: dto.grant },
        });

        return override;
    }

    async getAdminPermissionOverrides(adminId: string) {
        return this.rbacRepository.findAdminPermissionOverrides(adminId);
    }
}
