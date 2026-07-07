// apps/subscription-service/src/subscription/dto/assign.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsIn, IsDateString, IsUUID } from 'class-validator';

export class AssignSubscriptionDto {
    @IsUUID()
    employerId: string;

    @IsUUID()
    packageId: string;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class UpdateSubscriptionStatusDto {
    @IsString()
    @IsIn(['ACTIVE', 'EXPIRED', 'CANCELLED'])
    status: string;
}
