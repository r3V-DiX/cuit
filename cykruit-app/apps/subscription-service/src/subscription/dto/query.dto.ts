// apps/subscription-service/src/subscription/dto/query.dto.ts

import { IsOptional, IsInt, IsBoolean, IsString, IsIn, IsUUID, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PackageListQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number;

    /** Accepts query-string "true"/"false" or JSON boolean. */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isActive?: boolean;
}

export class SubscriptionListQueryDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @IsString()
    @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'])
    status?: string;

    @IsOptional()
    @IsUUID()
    packageId?: string;
}
