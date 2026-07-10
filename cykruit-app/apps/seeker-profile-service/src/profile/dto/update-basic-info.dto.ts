// apps/seeker-profile-service/src/profile/dto/update-basic-info.dto.ts

import {
  IsString,
  IsOptional,
  IsUrl,
  IsUUID,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

class LocationDataDto {
  @IsString() city: string;
  @IsOptional() @IsString() state?: string;
  @IsString() country: string;
}

export class UpdateBasicInfoDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDataDto)
  @IsObject()
  location?: LocationDataDto;
  @IsOptional() @IsUrl() linkedin?: string;
  @IsOptional() @IsUrl() github?: string;
  @IsOptional() @IsUrl() portfolio?: string;
  @IsOptional() @IsString() availability?: string;
  @IsOptional() @IsString() professionalEmail?: string;
}
