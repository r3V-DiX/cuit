import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min, Max, MaxLength } from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { JobType, WorkMode, ExperienceLevel } from "@prisma/client";

export class JobsQueryDto {
  @ApiPropertyOptional({
    description: "Search keyword for job title or company name",
    example: "developer",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by job role ID",
    example: "some-uuid",
  })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({
    description: "Filter by job type",
    enum: JobType,
    example: JobType.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(JobType, { message: "Invalid job type" })
  jobType?: JobType;

  @ApiPropertyOptional({
    description: "Filter by work mode",
    enum: WorkMode,
    example: WorkMode.REMOTE,
  })
  @IsOptional()
  @IsEnum(WorkMode, { message: "Invalid work mode" })
  workMode?: WorkMode;

  @ApiPropertyOptional({
    description: "Filter by location ID",
    example: "some-uuid",
  })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    description: "Filter by experience level",
    enum: ExperienceLevel,
    example: ExperienceLevel.ENTRY,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel, { message: "Invalid experience level" })
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({
    description: "Filter by job domain ID",
    example: "some-uuid",
  })
  @IsOptional()
  @IsString()
  domainId?: string;

  @ApiPropertyOptional({
    description: "Filter to featured jobs only",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    description: "Page number for pagination",
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of jobs per page",
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
