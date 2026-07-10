// apps/seeker-profile-service/src/profile/dto/certifications/add-certification.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsUUID,
  MaxLength,
  Matches,
} from "class-validator";

export class AddCertificationDto {
  @IsUUID() certificationId: string;
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  issueDate: string;
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  expiryDate?: string;
  @IsOptional() @IsString() @MaxLength(100) credentialId?: string;
  @IsOptional() @IsUrl() @MaxLength(500) credentialUrl?: string;
}
