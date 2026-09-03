// admin-app/src/modules/ads/dto/ads.dto.ts

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    Max,
    MaxLength,
    IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminAdsQueryDto {
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
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    slotKey?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return undefined;
    })
    @IsBoolean()
    isActive?: boolean;
}

export class CreateAdDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    slotKey: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    imageUrl: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    linkUrl: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    altText: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;
}

export class UpdateAdDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    slotKey?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    imageUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    linkUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    altText?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
