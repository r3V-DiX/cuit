// apps/seeker-profile-service/src/profile/dto/education/create-education.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateEducationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  degree: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldOfStudy?: string;

  // Either instituteId OR instituteName must be provided — not both, not neither
  @ValidateIf((o) => !o.instituteName)
  @IsUUID()
  @IsNotEmpty({
    message:
      "Provide either instituteId (existing) or instituteName (custom college)",
  })
  instituteId?: string;

  @ValidateIf((o) => !o.instituteId)
  @IsString()
  @IsNotEmpty({
    message:
      "Provide either instituteName (custom college) or instituteId (existing)",
  })
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  instituteName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: "Start date must be in YYYY format" })
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: "End date must be in YYYY format" })
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
