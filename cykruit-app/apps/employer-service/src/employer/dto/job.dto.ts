// apps/employer-service/src/employer/dto/job.dto.ts

import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsUrl,
    IsInt,
    MaxLength,
    MinLength,
    Min,
    Max,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobType, WorkMode, ExperienceLevel, ApplicationType, JobStatus } from '@prisma/client';

// ── Create ────────────────────────────────────────────────────────────────────

export class CreateJobDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    jobTitle: string;

    @IsOptional()
    @IsUUID()
    roleId?: string;

    @IsEnum(JobType)
    jobType: JobType;

    @IsEnum(WorkMode)
    workMode: WorkMode;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsEnum(ExperienceLevel)
    experienceLevel: ExperienceLevel;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    description?: string;

    @IsEnum(ApplicationType)
    applicationType: ApplicationType;

    /**
     * Required when applicationType === EXTERNAL.
     * Validated as a URL regardless when present.
     */
    @ValidateIf(o => o.applicationType === ApplicationType.EXTERNAL || o.externalUrl !== undefined)
    @IsUrl()
    externalUrl?: string;

    @IsOptional()
    screeningQuestions?: any;

    /** Only meaningful for CONTRACT jobType. */
    @IsOptional()
    @IsInt()
    @Min(1)
    contractDuration?: number;
}

// ── Update ────────────────────────────────────────────────────────────────────

export class UpdateJobDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    jobTitle?: string;

    @IsOptional()
    @IsUUID()
    roleId?: string;

    @IsOptional()
    @IsEnum(JobType)
    jobType?: JobType;

    @IsOptional()
    @IsEnum(WorkMode)
    workMode?: WorkMode;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsEnum(ExperienceLevel)
    experienceLevel?: ExperienceLevel;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    description?: string;

    @IsOptional()
    @IsEnum(ApplicationType)
    applicationType?: ApplicationType;

    @IsOptional()
    @IsUrl()
    externalUrl?: string;

    @IsOptional()
    screeningQuestions?: any;

    @IsOptional()
    @IsInt()
    @Min(1)
    contractDuration?: number;
}

// ── Close ─────────────────────────────────────────────────────────────────────

export class CloseJobDto {
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    reason: string;
}

// ── List Query ────────────────────────────────────────────────────────────────

export class JobListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(JobStatus)
    status?: JobStatus;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;
}
