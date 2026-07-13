// admin-app/src/admin/dto/reports.dto.ts

import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

const CONTENT_TYPES = ['JOB', 'EMPLOYER_PROFILE', 'SEEKER_PROFILE', 'MESSAGE'] as const;
const FLAG_STATUSES = ['PENDING', 'UNDER_REVIEW', 'RESOLVED_REMOVED', 'RESOLVED_DISMISSED'] as const;

export class ReportListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsIn(CONTENT_TYPES)
    contentType?: string;

    @IsOptional() @IsIn(FLAG_STATUSES)
    status?: string;
}

export class ResolveReportDto {
    @IsOptional() @IsString() @MaxLength(2000)
    adminNotes?: string;
}

export class DismissReportDto {
    @IsOptional() @IsString() @MaxLength(2000)
    adminNotes?: string;
}
