// admin-app/src/admin/services/rbac.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { RbacRepository } from '../repositories/rbac.repository';
import {
    CreateRoleDto,
    UpdateRoleDto,
    AssignRolePermissionsDto,
    AssignUserRoleDto,
    OverrideUserPermissionDto,
} from '../dto/rbac.dto';
import { AdminAuditLogger } from './admin-audit.logger';

@Injectable()
export class RbacService {
    constructor(
        private readonly rbacRepository: RbacRepository,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    async listRoles() {
        return this.rbacRepository.findAllRoles();
    }

    async getRole(id: string) {
        const role = await this.rbacRepository.findRoleById(id);
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    async createRole(adminId: string, dto: CreateRoleDto) {
        const role = await this.rbacRepository.createRole(dto);

        this.auditLogger.log({
            actorId: adminId,
            action: 'platform:manage_roles',
            module: 'rbac',
            targetType: 'SystemRole',
            targetId: role.id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { name: dto.name },
        });

        return role;
    }

    async updateRole(id: string, adminId: string, dto: UpdateRoleDto) {
        await this.getRole(id);
        const updated = await this.rbacRepository.updateRole(id, dto);

        this.auditLogger.log({
            actorId: adminId,
            action: 'platform:manage_roles',
            module: 'rbac',
            targetType: 'SystemRole',
            targetId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return updated;
    }

    async setRolePermissions(roleId: string, adminId: string, dto: AssignRolePermissionsDto) {
        await this.getRole(roleId);
        const updated = await this.rbacRepository.setRolePermissions(roleId, dto.permissionIds);

        this.auditLogger.log({
            actorId: adminId,
            action: 'platform:manage_permissions',
            module: 'rbac',
            targetType: 'SystemRole',
            targetId: roleId,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return updated;
    }

    async listPermissions() {
        return this.rbacRepository.findAllPermissions();
    }

    async assignUserRole(adminId: string, dto: AssignUserRoleDto) {
        const assignment = await this.rbacRepository.assignUserRole(
            dto.userId,
            dto.roleId,
            adminId,
            dto.employerId,
            dto.expiresAt,
        );

        this.auditLogger.log({
            actorId: adminId,
            action: 'platform:manage_roles',
            module: 'rbac',
            targetType: 'User',
            targetId: dto.userId,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { roleId: dto.roleId },
        });

        return assignment;
    }

    async revokeUserRole(assignmentId: string, adminId: string) {
        const revoked = await this.rbacRepository.revokeUserRole(assignmentId);

        this.auditLogger.log({
            actorId: adminId,
            action: 'platform:manage_roles',
            module: 'rbac',
            targetType: 'UserRoleAssignment',
            targetId: assignmentId,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        return revoked;
    }

    async getUserRoles(userId: string) {
        return this.rbacRepository.findUserRoles(userId);
    }

    async overrideUserPermission(adminId: string, dto: OverrideUserPermissionDto) {
        const override = await this.rbacRepository.overrideUserPermission(
            dto.userId,
            dto.permissionId,
            dto.grant,
            adminId,
            dto.reason,
            dto.employerId,
        );

        this.auditLogger.log({
            actorId: adminId,
            action: 'platform:manage_permissions',
            module: 'rbac',
            targetType: 'User',
            targetId: dto.userId,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
            newData: { permissionId: dto.permissionId, grant: dto.grant },
        });

        return override;
    }

    async getUserPermissionOverrides(userId: string) {
        return this.rbacRepository.findUserPermissionOverrides(userId);
    }
}
