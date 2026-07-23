// admin-app/src/modules/domains/dto/domains.dto.ts

import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DomainListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @Type(() => Boolean) @IsBoolean()
    isActive?: boolean;

    @IsOptional() @IsString() @MaxLength(100)
    q?: string;
}

export class CreateDomainDto {
    @IsString() @MaxLength(100)
    name: string;

    @IsString() @MaxLength(100) @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
        message: 'slug must be lowercase, alphanumeric, hyphen-separated',
    })
    slug: string;

    @IsOptional() @IsInt() @Type(() => Number)
    sortOrder?: number;
}

export class UpdateDomainDto {
    @IsOptional() @IsString() @MaxLength(100)
    name?: string;

    @IsOptional() @IsString() @MaxLength(100) @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
        message: 'slug must be lowercase, alphanumeric, hyphen-separated',
    })
    slug?: string;

    @IsOptional() @IsInt() @Type(() => Number)
    sortOrder?: number;
}
