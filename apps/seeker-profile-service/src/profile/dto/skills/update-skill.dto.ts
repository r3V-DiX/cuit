// apps/seeker-profile-service/src/profile/dto/skills/update-skill.dto.ts

import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';

enum SkillProficiency { BEGINNER = 'Beginner', INTERMEDIATE = 'Intermediate', EXPERT = 'Expert' }

export class UpdateSkillDto {
    @IsOptional() @IsEnum(SkillProficiency) proficiency?: SkillProficiency;
    @IsOptional() @IsInt() @Min(0) @Max(50) yearsOfExperience?: number;
}   