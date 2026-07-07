// apps/seeker-service/src/seeker/dto/apply-job.dto.ts

import {
    IsUUID,
    IsOptional,
    IsArray,
    ValidateNested,
    IsString,
    IsEnum,
    IsInt,
    MaxLength,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '@prisma/client';

export class ScreeningAnswerDto {
    @IsString()
    questionId: string;

    @IsString()
    @MaxLength(2000)
    answer: string;
}

export class ApplyJobDto {
    @IsOptional()
    @IsUUID()
    resumeId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(3000)
    coverLetter?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScreeningAnswerDto)
    screeningAnswers?: ScreeningAnswerDto[];

    @IsOptional()
    @IsBoolean()
    useAiScoring?: boolean = true;
}

export class WithdrawApplicationDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}

export class ApplicationListQueryDto {
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

    @IsOptional()
    @IsEnum(ApplicationStatus)
    status?: ApplicationStatus;
}
