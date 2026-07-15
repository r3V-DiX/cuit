// admin-app/src/admin/dto/discounts.dto.ts

import {
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
    IsInt,
    IsArray,
    IsObject,
    IsDateString,
    IsPositive,
    Min,
    Max,
    MaxLength,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountTrigger, DiscountType, DiscountApplicability, DiscountStatus, BillingCycle } from '@prisma/client';

export class DiscountListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsString()
    q?: string;

    @IsOptional() @IsEnum(DiscountStatus)
    status?: DiscountStatus;

    @IsOptional() @IsEnum(DiscountTrigger)
    trigger?: DiscountTrigger;
}

export class CreateDiscountDto {
    @IsString() @MinLength(2) @MaxLength(100)
    name: string;

    @IsOptional() @IsString() @MinLength(2) @MaxLength(50)
    code?: string;

    @IsEnum(DiscountTrigger)
    trigger: DiscountTrigger;

    @IsEnum(DiscountType)
    discountType: DiscountType;

    @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
    @ValidateIf((o: CreateDiscountDto) => o.discountType === DiscountType.PERCENTAGE)
    @Max(100)
    value: number;

    @IsOptional() @IsInt() @IsPositive()
    maxDiscountCap?: number;

    @IsOptional() @IsInt() @IsPositive()
    minOrderAmountPaise?: number;

    @IsEnum(DiscountApplicability)
    applicability: DiscountApplicability;

    @IsOptional() @IsArray() @IsString({ each: true })
    packageIds?: string[];

    @IsOptional() @IsArray() @IsEnum(BillingCycle, { each: true })
    billingCycles?: BillingCycle[];

    @IsOptional() @IsInt() @IsPositive()
    maxTotalUses?: number;

    @IsOptional() @IsInt() @IsPositive() @Min(1)
    maxUsesPerUser?: number;

    @IsDateString()
    startsAt: string;

    @IsOptional() @IsDateString()
    expiresAt?: string;

    @IsOptional() @IsObject()
    conditions?: {
        firstOrderOnly?: boolean;
        minTeamSize?: number;
        billingCycle?: 'MONTHLY' | 'YEARLY';
    };

    @IsOptional() @IsString() @MaxLength(500)
    description?: string;
}

export class UpdateDiscountDto {
    @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
    name?: string;

    @IsOptional() @IsEnum(DiscountType)
    discountType?: DiscountType;

    @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
    value?: number;

    @IsOptional() @IsInt() @IsPositive()
    maxDiscountCap?: number;

    @IsOptional() @IsInt() @IsPositive()
    minOrderAmountPaise?: number;

    @IsOptional() @IsEnum(DiscountApplicability)
    applicability?: DiscountApplicability;

    @IsOptional() @IsArray() @IsString({ each: true })
    packageIds?: string[];

    @IsOptional() @IsArray() @IsEnum(BillingCycle, { each: true })
    billingCycles?: BillingCycle[];

    @IsOptional() @IsInt() @IsPositive()
    maxTotalUses?: number;

    @IsOptional() @IsInt() @IsPositive() @Min(1)
    maxUsesPerUser?: number;

    @IsOptional() @IsDateString()
    startsAt?: string;

    @IsOptional() @IsDateString()
    expiresAt?: string;

    @IsOptional() @IsObject()
    conditions?: Record<string, unknown>;

    @IsOptional() @IsString() @MaxLength(500)
    description?: string;

    @IsOptional() @IsEnum(DiscountStatus)
    status?: DiscountStatus;
}

export class DiscountUsagesQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;
}
