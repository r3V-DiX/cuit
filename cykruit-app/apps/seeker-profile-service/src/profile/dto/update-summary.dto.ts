// apps/seeker-profile-service/src/profile/dto/update-summary.dto.ts

import { IsString, IsNotEmpty, Length } from "class-validator";

export class UpdateSummaryDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  summary: string;
}
