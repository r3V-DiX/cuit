// admin-app/src/modules/blogs/dto/blogs.dto.ts

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

export class AdminBlogsQueryDto {
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

export class CreateBlogDto {
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
    excerpt?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    coverImage?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean = false;
}

export class UpdateBlogDto {
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
    excerpt?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    coverImage?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}
