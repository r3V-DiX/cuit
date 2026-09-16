import { IsOptional, IsUUID } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class RolesListDto {
  @ApiPropertyOptional({
    description: "Filter roles by JobDomain id",
  })
  @IsOptional()
  @IsUUID()
  domainId?: string;
}
