// apps/seeker-service/src/seeker/dto/job-search.dto.ts

import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsInt,
    IsBoolean,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { JobType, WorkMode, ExperienceLevel } from '@prisma/client';

export class JobSearchDto {
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
    @IsString()
    @MaxLength(150)
    q?: string;

    @IsOptional()
    @IsEnum(JobType)
    jobType?: JobType;

    @IsOptional()
    @IsEnum(WorkMode)
    workMode?: WorkMode;

    @IsOptional()
    @IsEnum(ExperienceLevel)
    experienceLevel?: ExperienceLevel;

    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsUUID()
    skillId?: string;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    featuredOnly?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    sortBy?: 'recent' | 'relevance' = 'recent';
}
