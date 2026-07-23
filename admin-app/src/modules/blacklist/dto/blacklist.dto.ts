// admin-app/src/modules/blacklist/dto/blacklist.dto.ts

import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const BLACKLIST_TYPES = ['EMAIL', 'DOMAIN'] as const;

export class BlacklistListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsIn(BLACKLIST_TYPES)
    type?: string;

    @IsOptional() @IsString() @MaxLength(200)
    q?: string;
}

export class BlacklistEntryDto {
    @IsString() @MaxLength(255)
    value: string;

    @IsIn(BLACKLIST_TYPES)
    type: string;

    @IsOptional() @IsString() @MaxLength(500)
    reason?: string;
}

export class CreateBlacklistDto extends BlacklistEntryDto {}

export class BulkCreateBlacklistDto {
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500)
    @ValidateNested({ each: true })
    @Type(() => BlacklistEntryDto)
    entries: BlacklistEntryDto[];
}
