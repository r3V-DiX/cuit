// admin-app/src/modules/events/dto/events.dto.ts

import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    Max,
    MaxLength,
    IsNotEmpty,
    IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminEventsQueryDto {
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
    category?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return undefined;
    })
    @IsBoolean()
    isPublished?: boolean;
}

export class CreateEventDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    location?: string;

    @IsNotEmpty()
    @IsDateString()
    eventDate: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    bannerImage?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean = false;
}

export class UpdateEventDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    location?: string;

    @IsOptional()
    @IsDateString()
    eventDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    bannerImage?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}
