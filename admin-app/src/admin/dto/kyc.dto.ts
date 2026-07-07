// admin-app/src/admin/dto/kyc.dto.ts

import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationStatus } from '@prisma/client';

export class KycListQueryDto {
    @IsOptional()
    @IsEnum(VerificationStatus)
    status?: VerificationStatus;

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
}

export class ApproveKycDto {
    @IsOptional()
    @IsString()
    adminNotes?: string;
}

export class RejectKycDto {
    @IsString()
    rejectionReason: string;

    @IsOptional()
    @IsString()
    adminNotes?: string;
}
