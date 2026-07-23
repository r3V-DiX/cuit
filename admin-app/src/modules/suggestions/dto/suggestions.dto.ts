// admin-app/src/modules/suggestions/dto/suggestions.dto.ts

import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const SUGGESTION_TYPES = ['ROLE', 'SKILL', 'COMPANY'] as const;

export class SuggestionListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsIn(SUGGESTION_TYPES)
    type?: string;

    @IsOptional() @Type(() => Boolean) @IsBoolean()
    isActive?: boolean;

    @IsOptional() @IsString() @MaxLength(200)
    q?: string;
}

export class SuggestionEntryDto {
    @IsString() @MaxLength(200)
    text: string;

    @IsIn(SUGGESTION_TYPES)
    type: string;
}

export class CreateSuggestionDto extends SuggestionEntryDto {}

export class UpdateSuggestionDto {
    @IsOptional() @IsString() @MaxLength(200)
    text?: string;

    @IsOptional() @IsIn(SUGGESTION_TYPES)
    type?: string;
}

export class BulkCreateSuggestionsDto {
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500)
    @ValidateNested({ each: true })
    @Type(() => SuggestionEntryDto)
    entries: SuggestionEntryDto[];
}
