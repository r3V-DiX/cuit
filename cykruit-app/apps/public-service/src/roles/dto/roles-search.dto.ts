import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RolesSearchDto {
  @ApiProperty({
    description: "The search query for roles (minimum 1 character)",
    example: "analyst",
  })
  @IsString()
  @MinLength(1, { message: "Search query must be at least 1 character" })
  q: string;
}
