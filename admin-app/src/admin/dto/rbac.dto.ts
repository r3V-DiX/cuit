// admin-app/src/admin/dto/rbac.dto.ts

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

export class AssignUserRoleDto {
    @IsUUID('4')
    userId: string;

    @IsUUID('4')
    roleId: string;

    @IsOptional()
    @IsUUID('4')
    employerId?: string;

    @IsOptional()
    expiresAt?: Date;
}

export class OverrideUserPermissionDto {
    @IsUUID('4')
    userId: string;

    @IsUUID('4')
    permissionId: string;

    @IsBoolean()
    grant: boolean;

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsUUID('4')
    employerId?: string;

    @IsOptional()
    expiresAt?: Date;
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
