// apps/seeker-profile-service/src/profile/dto/skills/add-skill.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
} from "class-validator";

enum SkillProficiency {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  EXPERT = "Expert",
}

export class AddSkillDto {
  @IsUUID() skillId: string;
  @IsEnum(SkillProficiency) proficiency: SkillProficiency;
  @IsOptional() @IsInt() @Min(0) @Max(50) yearsOfExperience?: number;
}
