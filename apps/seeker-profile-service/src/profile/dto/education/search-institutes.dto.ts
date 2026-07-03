// apps/seeker-profile-service/src/profile/dto/education/search-institutes.dto.ts

import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class SearchInstitutesDto {
  @IsOptional() @IsString() @MaxLength(200) query?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number) limit?: number;
}
