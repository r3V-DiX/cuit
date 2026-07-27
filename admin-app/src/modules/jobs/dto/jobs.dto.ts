// admin-app/src/admin/dto/jobs.dto.ts

import { IsEnum, IsOptional, IsString, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus } from '@prisma/client';

export class AdminJobListQueryDto {
    @IsOptional()
    @IsEnum(JobStatus)
    status?: JobStatus;

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

export class ApproveJobDto {
    @IsOptional()
    @IsString()
    adminNotes?: string;
}

export class RejectJobDto {
    @IsString()
    reason: string;

    @IsOptional()
    @IsString()
    adminNotes?: string;
}

export class SetFeaturedJobDto {
    @IsBoolean()
    isFeatured: boolean;
}
