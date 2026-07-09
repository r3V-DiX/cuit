import { IsOptional, IsIn } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class TestimonialsQueryDto {
  @ApiPropertyOptional({ enum: ["SEEKER", "EMPLOYER"] })
  @IsOptional()
  @IsIn(["SEEKER", "EMPLOYER"])
  type?: "SEEKER" | "EMPLOYER";
}
