// admin-app/src/admin/dto/testimonials.dto.ts

import {
    IsString, IsOptional, IsInt, IsBoolean, IsIn,
    Min, Max, MaxLength, MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminTestimonialsQueryDto {
    @IsOptional()
    @IsIn(['SEEKER', 'EMPLOYER'])
    type?: 'SEEKER' | 'EMPLOYER';

    @IsOptional()
    @IsIn(['true', 'false', true, false])
    @Transform(({ value }) => value === 'true' || value === true)
    published?: boolean;

    @IsOptional()
    @IsString()
    q?: string;

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

export class CreateTestimonialDto {
    @IsIn(['SEEKER', 'EMPLOYER'])
    type: 'SEEKER' | 'EMPLOYER';

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(150)
    role: string;

    @IsString()
    @MinLength(2)
    @MaxLength(150)
    company: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    avatar?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    avatarColor?: string;

    @IsString()
    @MinLength(10)
    @MaxLength(1000)
    quote: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    stars?: number = 5;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    tag?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean = false;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sortOrder?: number = 0;
}

export class UpdateTestimonialDto {
    @IsOptional()
    @IsIn(['SEEKER', 'EMPLOYER'])
    type?: 'SEEKER' | 'EMPLOYER';

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    role?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    company?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    avatar?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    avatarColor?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(1000)
    quote?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    stars?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    tag?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
