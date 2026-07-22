// admin-app/src/modules/announcements/dto/announcements.dto.ts

import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

const ANNOUNCEMENT_TYPES = ['info', 'warning', 'critical'] as const;
const ANNOUNCEMENT_TARGETS = ['ALL', 'SEEKER', 'EMPLOYER'] as const;

export class AnnouncementListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsIn(ANNOUNCEMENT_TARGETS)
    target?: string;

    @IsOptional() @Type(() => Boolean) @IsBoolean()
    isActive?: boolean;
}

export class CreateAnnouncementDto {
    @IsString() @MaxLength(2000)
    message: string;

    @IsIn(ANNOUNCEMENT_TYPES)
    type: string;

    @IsOptional() @IsIn(ANNOUNCEMENT_TARGETS)
    target?: string;

    @IsOptional() @IsISO8601()
    startsAt?: string;

    @IsOptional() @IsISO8601()
    expiresAt?: string;
}

export class UpdateAnnouncementDto {
    @IsOptional() @IsString() @MaxLength(2000)
    message?: string;

    @IsOptional() @IsIn(ANNOUNCEMENT_TYPES)
    type?: string;

    @IsOptional() @IsIn(ANNOUNCEMENT_TARGETS)
    target?: string;

    @IsOptional() @IsISO8601()
    startsAt?: string;

    @IsOptional() @IsISO8601()
    expiresAt?: string;
}
