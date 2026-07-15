// apps/subscription-service/src/subscription/dto/package.dto.ts

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    IsNumberString,
    Matches,
    Min,
    MaxLength,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    maxActiveJobs?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxTeamMembers?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    featuredJobSlots?: number;

    @IsOptional()
    @IsBoolean()
    aiScoringEnabled?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    jobPostingPeriodDays?: number;

    @IsOptional()
    @IsBoolean()
    resumeViewEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    canExportApplicants?: boolean;

    @IsOptional()
    @IsBoolean()
    analyticsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    prioritySupportEnabled?: boolean;

    @IsOptional()
    @IsNumberString()
    @Matches(/^\d+(\.\d{1,2})?$/, { message: 'priceMonthly must be a positive number with up to 2 decimal places' })
    priceMonthly?: string;

    @IsOptional()
    @IsNumberString()
    @Matches(/^\d+(\.\d{1,2})?$/, { message: 'priceYearly must be a positive number with up to 2 decimal places' })
    priceYearly?: string;
}

export class UpdatePackageDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    maxActiveJobs?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    maxTeamMembers?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    featuredJobSlots?: number;

    @IsOptional()
    @IsBoolean()
    aiScoringEnabled?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    jobPostingPeriodDays?: number;

    @IsOptional()
    @IsBoolean()
    resumeViewEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    canExportApplicants?: boolean;

    @IsOptional()
    @IsBoolean()
    analyticsEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    prioritySupportEnabled?: boolean;

    @IsOptional()
    @IsNumberString()
    @Matches(/^\d+(\.\d{1,2})?$/, { message: 'priceMonthly must be a positive number with up to 2 decimal places' })
    priceMonthly?: string;

    @IsOptional()
    @IsNumberString()
    @Matches(/^\d+(\.\d{1,2})?$/, { message: 'priceYearly must be a positive number with up to 2 decimal places' })
    priceYearly?: string;
}
