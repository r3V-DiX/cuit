// apps/employer-service/src/employer/dto/job.dto.ts

import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsUrl,
    IsInt,
    IsArray,
    IsBoolean,
    MaxLength,
    MinLength,
    Min,
    Max,
    ValidateIf,
    ValidateNested,
    ArrayMaxSize,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobType, WorkMode, ExperienceLevel, ApplicationType, JobStatus } from '@prisma/client';

enum QuestionType {
    TEXT = 'TEXT',
    BOOLEAN = 'BOOLEAN',
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

class LocationDataDto {
    @IsString() @MaxLength(100) city: string;
    @IsOptional() @IsString() @MaxLength(100) state?: string;
    @IsString() @MaxLength(100) country: string;
}

export class ScreeningQuestionDto {
    @IsUUID()
    id: string;

    @IsString()
    @MaxLength(500)
    question: string;

    @IsBoolean()
    required: boolean;

    @IsEnum(QuestionType)
    type: QuestionType;
}

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

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDataDto)
    @IsObject()
    location?: LocationDataDto;

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
    @IsArray()
    @ArrayMaxSize(15)
    @ValidateNested({ each: true })
    @Type(() => ScreeningQuestionDto)
    screeningQuestions?: ScreeningQuestionDto[];

    /** Only meaningful for CONTRACT jobType. */
    @IsOptional()
    @IsInt()
    @Min(1)
    contractDuration?: number;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    skillNames?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requirements?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    responsibilities?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    niceToHave?: string[];
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
    @ValidateNested()
    @Type(() => LocationDataDto)
    @IsObject()
    location?: LocationDataDto;

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
    @IsArray()
    @ArrayMaxSize(15)
    @ValidateNested({ each: true })
    @Type(() => ScreeningQuestionDto)
    screeningQuestions?: ScreeningQuestionDto[];

    @IsOptional()
    @IsInt()
    @Min(1)
    contractDuration?: number;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    skillNames?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requirements?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    responsibilities?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    niceToHave?: string[];
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
