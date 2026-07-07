// admin-app/src/admin/dto/subscription.dto.ts

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsInt,
    IsIn,
    IsPositive,
    Min,
    Max,
    IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
// SubscriptionStatus is a plain string in schema: ACTIVE | EXPIRED | CANCELLED

export class CreatePackageDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @IsPositive()
    maxActiveJobs: number;

    @IsInt()
    @IsPositive()
    maxTeamMembers: number;

    @IsInt()
    @Min(0)
    featuredJobSlots: number;

    @IsBoolean()
    aiScoringEnabled: boolean;

    @IsNumber()
    @Min(0)
    priceMonthly: number;

    @IsNumber()
    @Min(0)
    priceYearly: number;
}

export class UpdatePackageDto {
    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsInt()
    @IsPositive()
    maxActiveJobs?: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    maxTeamMembers?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    featuredJobSlots?: number;

    @IsOptional()
    @IsBoolean()
    aiScoringEnabled?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    priceMonthly?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    priceYearly?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AssignSubscriptionDto {
    @IsUUID('4')
    employerId: string;

    @IsUUID('4')
    packageId: string;

    @IsOptional()
    @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'])
    status?: string;
}

export class SubscriptionListQueryDto {
    @IsOptional()
    @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'])
    status?: string;

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
