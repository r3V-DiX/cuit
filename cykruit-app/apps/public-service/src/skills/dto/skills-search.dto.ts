import { IsString, IsOptional, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SkillsSearchDto {
  @ApiProperty({
    description: "The search query for skills (minimum 1 character)",
    example: "penetration",
  })
  @IsString()
  @MinLength(1, { message: "Search query must be at least 1 character" })
  q: string;

  @ApiPropertyOptional({
    description: "Filter skills by category ID",
    example: "some-uuid",
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
