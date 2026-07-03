// apps/employer-service/src/employer/dto/kyc.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

/**
 * SubmitKycDto — No body fields required.
 * The KYC document arrives as a multipart file upload.
 * Company profile snapshots are read directly from the Employer record.
 */
export class SubmitKycDto {}

/**
 * UpdateKycStatusDto — Admin-only status transition payload.
 * Used by admin-service to approve or reject a verification submission.
 */
export class UpdateKycStatusDto {
    @IsEnum(VerificationStatus)
    status: VerificationStatus;

    @IsOptional()
    @IsString()
    rejectionReason?: string;

    @IsOptional()
    @IsString()
    adminNotes?: string;
}
