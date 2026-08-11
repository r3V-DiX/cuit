// admin-app/src/admin/dto/admins.dto.ts

import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsString()
    q?: string;
}

export class InviteAdminDto {
    @IsEmail()
    email: string;

    @IsOptional() @IsString()
    roleId?: string;
}

export class AcceptInviteDto {
    @IsString()
    token: string;

    @IsString() @MinLength(1) @MaxLength(100)
    firstName: string;

    @IsString() @MinLength(1) @MaxLength(100)
    lastName: string;
}
