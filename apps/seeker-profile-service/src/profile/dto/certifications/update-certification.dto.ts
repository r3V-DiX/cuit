// apps/seeker-profile-service/src/profile/dto/certifications/update-certification.dto.ts

import { IsString, IsOptional, IsUrl, MaxLength, Matches } from 'class-validator';

export class UpdateCertificationDto {
    @IsOptional() @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) issueDate?: string;
    @IsOptional() @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) expiryDate?: string;
    @IsOptional() @IsString() @MaxLength(100) credentialId?: string;
    @IsOptional() @IsUrl() @MaxLength(500) credentialUrl?: string;
}