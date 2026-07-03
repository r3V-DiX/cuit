// apps/seeker-profile-service/src/profile/dto/certifications/search-certifications.dto.ts

import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCertificationsDto {
    @IsOptional() @IsString() query?: string;
    @IsOptional() @IsString() organization?: string;
    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number) limit?: number;
}