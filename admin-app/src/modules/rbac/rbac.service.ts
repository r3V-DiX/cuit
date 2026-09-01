// admin-app/src/admin/services/rbac.service.ts
// Console RBAC management. System roles (super_admin / platform_admin / reviewer)
// are seed-owned: no rename, no deactivation, and super_admin's permission set is locked.

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RbacRepository } from './rbac.repository';
import {
    CreateRoleDto,
    UpdateRoleDto,
    AssignRolePermissionsDto,
    AssignAdminRoleDto,
    OverrideAdminPermissionDto,
} from './dto/rbac.dto';
import { AdminAuditLogger } from '../../common';
import { PermissionsService } from '../../common';
import { SYSTEM_ROLE_NAMES, SUPER_ADMIN_ROLE } from '../../common';
import { isProtectedRootAdmin } from '../../common';

@Injectable()
export class RbacService {
    constructor(
        private readonly rbacRepository: RbacRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly permissionsService: PermissionsService,
        private readonly configService: ConfigService,
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

        const actingAdminRoles = await this.rbacRepository.findAdminRoles(actingAdminId);
        if (actingAdminRoles.some((r) => r.roleId === roleId)) {
            throw new ForbiddenException(
                'You cannot edit the permission set of a role you currently hold.',
            );
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

    async deleteRole(id: string, actingAdminId: string) {
        const role = await this.getRole(id);

        if (SYSTEM_ROLE_NAMES.includes(role.name)) {
            throw new ForbiddenException('System roles cannot be deleted');
        }

        const assignmentCount = await this.rbacRepository.countRoleAssignments(id);
        if (assignmentCount > 0) {
            throw new BadRequestException(
                `Cannot delete a role assigned to ${assignmentCount} admin(s). Revoke the assignment(s) first.`,
            );
        }

        await this.rbacRepository.deleteRole(id);

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'AdminRbacRole',
            resourceId: id,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
            oldData: { name: role.name },
        });

        return { success: true };
    }

    async listPermissions() {
        return this.rbacRepository.findAllPermissions();
    }

async assignAdminRole(actingAdminId: string, dto: AssignAdminRoleDto) {
        if (actingAdminId === dto.adminId) {
            throw new ForbiddenException('You cannot change your own role.');
        }

        const targetEmail = await this.rbacRepository.findAdminEmail(dto.adminId);
        const bootstrapEmail = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');
        if (targetEmail && isProtectedRootAdmin(targetEmail, bootstrapEmail)) {
            throw new ForbiddenException(
                'This account is protected and cannot be modified by another admin.',
            );
        }

        const role = await this.getRole(dto.roleId);
        const previousRoles = await this.rbacRepository.findAdminRoles(dto.adminId);

        const losingSuperAdmin = previousRoles.find(
            (r) => r.role.name === SUPER_ADMIN_ROLE && r.roleId !== dto.roleId,
        );
        if (losingSuperAdmin) {
            const superAdminCount = await this.rbacRepository.countActiveRoleAssignments(
                losingSuperAdmin.roleId,
            );
            if (superAdminCount <= 1) {
                throw new ForbiddenException(
                    "Cannot replace the last super_admin's role — at least one super_admin must remain.",
                );
            }
        }

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
            riskLevel: role.name === SUPER_ADMIN_ROLE ? 'CRITICAL' : 'HIGH',
            result: 'SUCCESS',
            oldData: { previousRoleIds: previousRoles.map((r) => r.roleId) },
            newData: { roleId: dto.roleId },
        });

        return assignment;
    }

    async revokeAdminRole(assignmentId: string, actingAdminId: string) {
        const assignment = await this.rbacRepository.findAdminRoleAssignmentById(assignmentId);
        if (!assignment) throw new NotFoundException('Role assignment not found');

        if (assignment.adminId === actingAdminId) {
            throw new ForbiddenException('You cannot revoke your own role.');
        }

        const bootstrapEmail = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');
        if (isProtectedRootAdmin(assignment.admin.email, bootstrapEmail)) {
            throw new ForbiddenException(
                'This account is protected and cannot be modified by another admin.',
            );
        }

        if (assignment.role.name === SUPER_ADMIN_ROLE) {
            const superAdminCount = await this.rbacRepository.countActiveRoleAssignments(
                assignment.roleId,
            );
            if (superAdminCount <= 1) {
                throw new ForbiddenException(
                    'Cannot revoke the last super_admin — at least one must remain.',
                );
            }
        }

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

    async getAdminSummary(adminId: string) {
        const admin = await this.rbacRepository.findAdminSummary(adminId);
        if (!admin) throw new NotFoundException('Admin not found');
        return admin;
    }

    async getAdminRoles(adminId: string) {
        return this.rbacRepository.findAdminRoles(adminId);
    }

    async overrideAdminPermission(actingAdminId: string, dto: OverrideAdminPermissionDto) {
        if (actingAdminId === dto.adminId) {
            throw new ForbiddenException('You cannot override your own permissions.');
        }

        const targetEmail = await this.rbacRepository.findAdminEmail(dto.adminId);
        const bootstrapEmail = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');
        if (targetEmail && isProtectedRootAdmin(targetEmail, bootstrapEmail)) {
            throw new ForbiddenException(
                'This account is protected and cannot be modified by another admin.',
            );
        }

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

    async deleteAdminPermissionOverride(id: string, actingAdminId: string) {
        const override = await this.rbacRepository.findAdminPermissionOverrideById(id);
        if (!override) throw new NotFoundException('Permission override not found');

        if (override.adminId === actingAdminId) {
            throw new ForbiddenException('You cannot override your own permissions.');
        }

        const bootstrapEmail = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');
        if (isProtectedRootAdmin(override.admin.email, bootstrapEmail)) {
            throw new ForbiddenException(
                'This account is protected and cannot be modified by another admin.',
            );
        }

        const deleted = await this.rbacRepository.deleteAdminPermissionOverride(id);
        this.permissionsService.clearCache(deleted.adminId);

        this.auditLogger.log({
            adminId: actingAdminId,
            action: 'rbac:manage',
            module: 'rbac',
            resource: 'Admin',
            resourceId: deleted.adminId,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
            oldData: { permissionId: deleted.permissionId, grant: deleted.grant },
        });

        return deleted;
    }
}
