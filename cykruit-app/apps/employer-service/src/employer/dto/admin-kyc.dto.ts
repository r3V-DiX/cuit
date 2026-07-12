// apps/employer-service/src/employer/dto/admin-kyc.dto.ts

import { IsInt, IsIn, IsOptional, IsString, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';

const REVIEWABLE_STATUSES = [
    VerificationStatus.PENDING,
    VerificationStatus.UNDER_REVIEW,
    VerificationStatus.APPROVED,
    VerificationStatus.REJECTED,
] as const;

export class AdminKycQueryDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 20, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ description: 'Search by company name' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ enum: VerificationStatus })
    @IsOptional()
    @IsIn(REVIEWABLE_STATUSES)
    status?: VerificationStatus;
}

export class ApproveKycDto {
    @ApiPropertyOptional({ maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    adminNotes?: string;
}

export class RejectKycDto {
    @ApiPropertyOptional({ minLength: 1, maxLength: 2000 })
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    rejectionReason: string;

    @ApiPropertyOptional({ maxLength: 1000 })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    adminNotes?: string;
}
