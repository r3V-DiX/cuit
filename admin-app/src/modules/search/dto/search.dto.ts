// admin-app/src/modules/search/dto/search.dto.ts

import { IsString, MinLength, MaxLength } from 'class-validator';

export class SearchQueryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    q!: string;
}
