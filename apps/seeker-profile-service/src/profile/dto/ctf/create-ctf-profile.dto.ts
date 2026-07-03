// apps/seeker-profile-service/src/profile/dto/ctf/create-ctf-profile.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateCTFProfileDto {
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(50) platform: string;
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(50) username: string;
  @IsUrl() @IsNotEmpty() @MaxLength(500) profileUrl: string;
  @IsOptional() @IsString() @MaxLength(50) rank?: string;
  @IsOptional() @IsInt() @Min(0) points?: number;
}
