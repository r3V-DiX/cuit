// admin-app/src/modules/export/dto/export.dto.ts

import { IsIn, IsISO8601, IsOptional } from 'class-validator';

const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'PENDING_DELETION', 'SUSPENDED', 'DELETED'] as const;
const USER_ROLES = ['SEEKER', 'EMPLOYER'] as const;
const JOB_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'EXPIRED'] as const;

export class ExportUsersQueryDto {
    @IsOptional() @IsIn(ACCOUNT_STATUSES)
    status?: string;

    @IsOptional() @IsIn(USER_ROLES)
    role?: string;
}

export class ExportJobsQueryDto {
    @IsOptional() @IsIn(JOB_STATUSES)
    status?: string;
}

export class ExportApplicationsQueryDto {
    @IsOptional() @IsISO8601()
    from?: string;

    @IsOptional() @IsISO8601()
    to?: string;
}
