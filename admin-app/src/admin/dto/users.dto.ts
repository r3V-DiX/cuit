// admin-app/src/admin/dto/users.dto.ts

import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, AccountStatus } from '@prisma/client';

export class AdminUserListQueryDto {
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsEnum(AccountStatus)
    status?: AccountStatus;

    @IsOptional()
    @IsString()
    q?: string;

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
    limit?: number = 20;
}

export class SuspendUserDto {
    @IsOptional()
    @IsString()
    reason?: string;
}

export class UnsuspendUserDto {
    @IsOptional()
    @IsString()
    reason?: string;
}
