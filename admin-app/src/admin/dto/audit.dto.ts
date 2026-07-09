// admin-app/src/admin/dto/audit.dto.ts

import { IsOptional, IsString, IsIn, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditLogQueryDto {
    @IsOptional()
    @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    riskLevel?: string;

    @IsOptional()
    @IsIn(['SUCCESS', 'FAILURE', 'DENIED'])
    result?: string;

    @IsOptional()
    @IsString()
    actorRole?: string;

    @IsOptional()
    @IsString()
    module?: string;

    @IsOptional()
    @IsString()
    actorId?: string;

    @IsOptional()
    @IsString()
    targetId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

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

export class AuthAuditLogQueryDto {
    @IsOptional()
    @IsIn(['SUCCESS', 'FAILURE'])
    status?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    action?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

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
