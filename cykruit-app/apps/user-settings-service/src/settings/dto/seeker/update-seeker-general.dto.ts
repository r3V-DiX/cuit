// apps/user-settings-service/src/settings/dto/seeker/update-seeker-general.dto.ts

import {
    IsEnum,
    IsOptional,
    IsBoolean,
    IsDateString,
    IsArray,
    ArrayMaxSize,
} from 'class-validator';
import { ProfileVisibility, JobSearchStatus, JobType, WorkMode } from '@prisma/client';

export class UpdateSeekerGeneralDto {
    @IsOptional()
    @IsEnum(ProfileVisibility, {
        message: `profileVisibility must be one of: ${Object.values(ProfileVisibility).join(', ')}`,
    })
    profileVisibility?: ProfileVisibility;

    @IsOptional()
    @IsEnum(JobSearchStatus, {
        message: `jobSearchStatus must be one of: ${Object.values(JobSearchStatus).join(', ')}`,
    })
    jobSearchStatus?: JobSearchStatus;

    @IsOptional()
    @IsDateString({}, { message: 'availableFrom must be a valid ISO date string' })
    availableFrom?: string | null;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(4, { message: 'preferredJobTypes can have at most 4 entries' })
    @IsEnum(JobType, {
        each: true,
        message: `Each preferredJobType must be one of: ${Object.values(JobType).join(', ')}`,
    })
    preferredJobTypes?: JobType[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(3, { message: 'preferredWorkModes can have at most 3 entries' })
    @IsEnum(WorkMode, {
        each: true,
        message: `Each preferredWorkMode must be one of: ${Object.values(WorkMode).join(', ')}`,
    })
    preferredWorkModes?: WorkMode[];

    @IsOptional()
    @IsBoolean({ message: 'willingToRelocate must be a boolean' })
    willingToRelocate?: boolean;
}