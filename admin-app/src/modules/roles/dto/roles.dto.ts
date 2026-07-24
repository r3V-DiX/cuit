// admin-app/src/modules/roles/dto/roles.dto.ts

import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RoleListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @Type(() => Boolean) @IsBoolean()
    isActive?: boolean;

    @IsOptional() @IsUUID('4')
    domainId?: string;

    @IsOptional() @IsString() @MaxLength(100)
    q?: string;
}

export class CreateRoleDto {
    @IsString() @MaxLength(150)
    name: string;

    @IsOptional() @IsString() @MaxLength(2000)
    description?: string;

    // null clears/omits the domain; a string must be a valid v4 UUID
    @IsOptional() @IsUUID('4')
    domainId?: string | null;
}

export class UpdateRoleDto {
    @IsOptional() @IsString() @MaxLength(150)
    name?: string;

    @IsOptional() @IsString() @MaxLength(2000)
    description?: string;

    // null clears the domain; a string must be a valid v4 UUID; omit to leave unchanged
    @IsOptional() @IsUUID('4')
    domainId?: string | null;
}
