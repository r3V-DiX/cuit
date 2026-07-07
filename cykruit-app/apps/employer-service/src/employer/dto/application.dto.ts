// apps/employer-service/src/employer/dto/application.dto.ts

import { IsEnum, IsInt, IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '@prisma/client';

/** Statuses an employer is allowed to set via the API. */
export const EMPLOYER_SETTABLE_STATUSES = [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
] as const;

export class ApplicationListQueryDto {
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
    @IsEnum(ApplicationStatus)
    status?: ApplicationStatus;
}

export class UpdateApplicationStatusDto {
    @IsIn(EMPLOYER_SETTABLE_STATUSES)
    status: ApplicationStatus;

    @IsOptional()
    @IsString()
    note?: string;
}
