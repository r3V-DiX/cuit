// apps/user-settings-service/src/settings/dto/seeker/update-seeker-notifications.dto.ts

import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { EmailFrequency } from '@prisma/client';

export class UpdateSeekerNotificationsDto {
    // ── Global ──────────────────────────────────────────────────
    @IsOptional() @IsBoolean() enableInApp?: boolean;
    @IsOptional() @IsBoolean() enableEmail?: boolean;

    // ── Applications ────────────────────────────────────────────
    @IsOptional() @IsBoolean() applicationSubmitted_inApp?: boolean;
    @IsOptional() @IsBoolean() applicationSubmitted_email?: boolean;

    @IsOptional() @IsBoolean() applicationStatus_inApp?: boolean;
    @IsOptional() @IsBoolean() applicationStatus_email?: boolean;

    @IsOptional() @IsBoolean() jobRejection_inApp?: boolean;
    @IsOptional() @IsBoolean() jobRejection_email?: boolean;

    // ── Interviews ───────────────────────────────────────────────
    @IsOptional() @IsBoolean() interviewScheduled_inApp?: boolean;
    @IsOptional() @IsBoolean() interviewScheduled_email?: boolean;

    // ── Job Alerts ───────────────────────────────────────────────
    @IsOptional() @IsBoolean() jobAlert_inApp?: boolean;
    @IsOptional() @IsBoolean() jobAlert_email?: boolean;

    @IsOptional()
    @IsEnum(EmailFrequency, {
        message: `jobAlert_frequency must be one of: ${Object.values(EmailFrequency).join(', ')}`,
    })
    jobAlert_frequency?: EmailFrequency;
}