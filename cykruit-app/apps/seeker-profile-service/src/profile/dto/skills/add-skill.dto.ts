// apps/seeker-profile-service/src/profile/dto/skills/add-skill.dto.ts

import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

export enum SkillProficiency {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  EXPERT = "Expert",
}

export class AddSkillDto {
  @IsUUID() skillId: string;
  @IsEnum(SkillProficiency) proficiency: SkillProficiency;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(50) yearsOfExperience?: number;
}
