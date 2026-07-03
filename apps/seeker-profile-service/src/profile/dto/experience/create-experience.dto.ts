// apps/seeker-profile-service/src/profile/dto/experience/create-experience.dto.ts
// (same as old, just clean import)

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
  ValidateIf,
} from "class-validator";

enum EmploymentType {
  FULL_TIME = "Full-time",
  PART_TIME = "Part-time",
  CONTRACT = "Contract",
  FREELANCE = "Freelance",
  INTERNSHIP = "Internship",
}

export class CreateExperienceDto {
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(100) title: string;
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(100) company: string;
  @IsString() @IsNotEmpty() @MaxLength(200) location: string;
  @IsEnum(EmploymentType) @IsOptional() employmentType?: EmploymentType;
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "Start date must be in YYYY-MM format",
  })
  startDate: string;
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.endDate !== "")
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "End date must be in YYYY-MM format",
  })
  endDate?: string;
  @IsBoolean() current: boolean;
  @IsString() @IsNotEmpty() @MinLength(5) @MaxLength(2000) description: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tools: string[];
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  achievements?: string[];
}
