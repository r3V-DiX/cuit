// admin-app/src/admin/dto/audit.dto.ts
// Three query shapes, one per audit-logs tab in admin-ui:
//   AdminActivityLogQueryDto → GET /admin/audit-logs/admin-activity (AdminAuditLog)
//   UnifiedAuthLogQueryDto   → GET /admin/audit-logs               (AuthAuditLog + AdminAuthAuditLog, merged)
//   SystemAuditLogQueryDto   → GET /admin/audit-logs/system         (AuditLog)

import { IsOptional, IsString, IsIn, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminActivityLogQueryDto {
    @IsOptional()
    @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    riskLevel?: string;

    @IsOptional()
    @IsIn(['SUCCESS', 'FAILURE', 'DENIED'])
    result?: string;

    @IsOptional()
    @IsString()
    module?: string;

    @IsOptional()
    @IsString()
    adminId?: string;

    @IsOptional()
    @IsString()
    resource?: string;

    @IsOptional()
    @IsString()
    resourceId?: string;

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
    @IsIn(['createdAt', 'riskLevel'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

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

export class UnifiedAuthLogQueryDto {
    @IsOptional()
    @IsIn(['MAIN_APP', 'ADMIN_CONSOLE'])
    source?: 'MAIN_APP' | 'ADMIN_CONSOLE';

    @IsOptional()
    @IsIn(['SUCCESS', 'FAILURE'])
    status?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    action?: string;

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
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

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

export class SystemAuditLogQueryDto {
    @IsOptional()
    @IsString()
    module?: string;

    @IsOptional()
    @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    riskLevel?: string;

    @IsOptional()
    @IsIn(['SUCCESS', 'FAILURE', 'DENIED'])
    result?: string;

    @IsOptional()
    @IsString()
    actorId?: string;

    @IsOptional()
    @IsString()
    targetType?: string;

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
    @IsIn(['createdAt', 'riskLevel'])
    sortBy?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

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
