// admin-app/src/admin/dto/rbac.dto.ts
// Console RBAC — roles/permissions/overrides belong to Admin accounts (Admin* tables).

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsUUID,
    IsArray,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    permissionIds?: string[];
}

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AssignRolePermissionsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    permissionIds: string[];
}

export class AssignAdminRoleDto {
    @IsUUID('4')
    adminId: string;

    @IsUUID('4')
    roleId: string;

    @IsOptional()
    expiresAt?: Date;
}

export class OverrideAdminPermissionDto {
    @IsUUID('4')
    adminId: string;

    @IsUUID('4')
    permissionId: string;

    @IsBoolean()
    grant: boolean;

    @IsOptional()
    @IsString()
    reason?: string;
}

export class RbacListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 50;
}
