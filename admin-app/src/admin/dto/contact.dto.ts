// admin-app/src/admin/dto/contact.dto.ts

import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

const CONTACT_STATUSES = ['PENDING', 'REVIEWED', 'RESOLVED', 'SPAM'] as const;

export class ContactListQueryDto {
    @IsOptional() @IsInt() @Min(1) @Type(() => Number)
    page?: number = 1;

    @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
    limit?: number = 20;

    @IsOptional() @IsString()
    q?: string;

    @IsOptional() @IsIn(CONTACT_STATUSES)
    status?: string;
}

export class UpdateContactStatusDto {
    @IsIn(CONTACT_STATUSES)
    status: string;

    @IsOptional() @IsString() @MaxLength(2000)
    notes?: string;
}
