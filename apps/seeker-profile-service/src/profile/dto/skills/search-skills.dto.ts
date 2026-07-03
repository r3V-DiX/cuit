// apps/seeker-profile-service/src/profile/dto/skills/search-skills.dto.ts

import { IsString, IsOptional, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class SearchSkillsDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number) limit?: number;
}
