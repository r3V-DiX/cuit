// apps/employer-service/src/employer/dto/admin-jobs.dto.ts

import {
    IsOptional,
    IsString,
    IsEnum,
    IsInt,
    IsIn,
    MaxLength,
    MinLength,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus } from '@prisma/client';

const JOB_STATUS_VALUES = Object.values(JobStatus);

export class AdminJobQueryDto {
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

    @IsOptional()
    @IsString()
    @MaxLength(200)
    q?: string;

    @IsOptional()
    @IsIn(JOB_STATUS_VALUES)
    status?: JobStatus;
}

export class ApproveJobDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    adminNotes?: string;
}

export class RejectJobDto {
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    reason: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    adminNotes?: string;
}
