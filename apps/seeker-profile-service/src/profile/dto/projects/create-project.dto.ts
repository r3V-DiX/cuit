// apps/seeker-profile-service/src/profile/dto/projects/create-project.dto.ts

import { IsString, IsNotEmpty, IsBoolean, IsArray, IsOptional, IsUrl, MinLength, MaxLength, ArrayMinSize, ArrayMaxSize, Matches, ValidateIf } from 'class-validator';

export class CreateProjectDto {
    @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(100) title: string;
    @IsString() @IsNotEmpty() @MinLength(10) @MaxLength(2000) description: string;
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(50, { each: true }) technologies: string[];
    @IsOptional() @IsUrl() @ValidateIf(o => o.projectUrl?.trim() !== '') @MaxLength(500) projectUrl?: string;
    @IsOptional() @IsString() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) startDate?: string;
    @IsOptional() @IsString() @ValidateIf(o => o.endDate?.trim() !== '') @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) endDate?: string;
    @IsOptional() @IsBoolean() current?: boolean;
    @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(500, { each: true }) highlights?: string[];
}