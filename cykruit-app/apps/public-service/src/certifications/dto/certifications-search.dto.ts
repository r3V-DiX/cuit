import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CertificationsSearchDto {
  @ApiProperty({
    description: "The search query for certifications (minimum 1 character)",
    example: "oscp",
  })
  @IsString()
  @MinLength(1, { message: "Search query must be at least 1 character" })
  q: string;
}
