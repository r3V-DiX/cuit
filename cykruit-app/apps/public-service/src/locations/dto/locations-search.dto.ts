import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LocationSearchDto {
  @ApiProperty({
    description: "The search query for locations (minimum 2 characters)",
    example: "mumbai",
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: "Search query must be at least 2 characters long" })
  q: string;
}
