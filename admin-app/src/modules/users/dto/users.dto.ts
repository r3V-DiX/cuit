// admin-app/src/admin/dto/users.dto.ts

import { IsEnum, IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
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
    @MaxLength(200)
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
    @MaxLength(1000)
    reason?: string;
}

export class UnsuspendUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    reason?: string;
}
