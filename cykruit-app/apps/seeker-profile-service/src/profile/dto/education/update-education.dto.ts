// apps/seeker-profile-service/src/profile/dto/education/update-education.dto.ts

import {
  IsString,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

export class UpdateEducationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  degree?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldOfStudy?: string;

  // Can update to a predefined institute
  @IsOptional()
  @IsUUID()
  instituteId?: string;

  // Or can update to a custom institute name
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  instituteName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
