// admin-app/src/admin/dto/audit.dto.ts

import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
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
