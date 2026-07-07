// apps/seeker-service/src/seeker/dto/saved-job.dto.ts

import { IsOptional, IsString, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveJobDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}

export class SavedJobListQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;
}
