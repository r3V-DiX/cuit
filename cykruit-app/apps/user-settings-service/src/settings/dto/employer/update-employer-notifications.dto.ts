// apps/user-settings-service/src/settings/dto/employer/update-employer-notifications.dto.ts

import { IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { EmailFrequency } from '@prisma/client';

export class UpdateEmployerNotificationsDto {
    // ── Global ──────────────────────────────────────────────────
    @IsOptional() @IsBoolean() enableInApp?: boolean;
    @IsOptional() @IsBoolean() enableEmail?: boolean;

    // ── Applicants ───────────────────────────────────────────────
    @IsOptional() @IsBoolean() newApplicant_inApp?: boolean;
    @IsOptional() @IsBoolean() newApplicant_email?: boolean;

    @IsOptional() @IsBoolean() applicationUpdate_inApp?: boolean;
    @IsOptional() @IsBoolean() applicationUpdate_email?: boolean;

    @IsOptional() @IsBoolean() groupedApplicants_inApp?: boolean;
    @IsOptional() @IsBoolean() groupedApplicants_email?: boolean;

    @IsOptional()
    @IsEnum(EmailFrequency, {
        message: `groupedApplicants_frequency must be one of: ${Object.values(EmailFrequency).join(', ')}`,
    })
    groupedApplicants_frequency?: EmailFrequency;

    // ── Job Management ───────────────────────────────────────────
    @IsOptional() @IsBoolean() jobExpiryAlert_inApp?: boolean;
    @IsOptional() @IsBoolean() jobExpiryAlert_email?: boolean;

    @IsOptional() @IsBoolean() jobApproval_inApp?: boolean;
    @IsOptional() @IsBoolean() jobApproval_email?: boolean;

    // ── KYC ─────────────────────────────────────────────────────
    @IsOptional() @IsBoolean() kycApproved_inApp?: boolean;
    @IsOptional() @IsBoolean() kycApproved_email?: boolean;

    @IsOptional() @IsBoolean() kycRejected_inApp?: boolean;
    @IsOptional() @IsBoolean() kycRejected_email?: boolean;

    // ── Platform ─────────────────────────────────────────────────
    @IsOptional() @IsBoolean() platformAnnouncement_inApp?: boolean;
    @IsOptional() @IsBoolean() platformAnnouncement_email?: boolean;
}