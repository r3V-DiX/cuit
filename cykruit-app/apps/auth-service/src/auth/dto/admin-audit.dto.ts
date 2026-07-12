// apps/auth-service/src/auth/dto/admin-audit.dto.ts

import {
  IsOptional,
  IsString,
  IsInt,
  IsIn,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

export class AdminAuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  @IsOptional()
  @IsIn(["SUCCESS", "FAILURE", "DENIED"])
  result?: "SUCCESS" | "FAILURE" | "DENIED";

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
