// apps/seeker-profile-service/src/profile/dto/update-basic-info.dto.ts

import {
  IsString,
  IsOptional,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

class LocationDataDto {
  @IsString() @MaxLength(100) city: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsString() @MaxLength(100) country: string;
}

export class UpdateBasicInfoDto {
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(150) title?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDataDto)
  @IsObject()
  location?: LocationDataDto;
  @IsOptional() @IsUrl() linkedin?: string;
  @IsOptional() @IsUrl() github?: string;
  @IsOptional() @IsUrl() portfolio?: string;
  @IsOptional() @IsString() @MaxLength(100) availability?: string;
  @IsOptional() @IsString() @MaxLength(254) professionalEmail?: string;
}
