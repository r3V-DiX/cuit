// apps/subscription-service/src/subscription/dto/assign.dto.ts

import { IsNotEmpty, IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';

export class AssignSubscriptionDto {
    @IsUUID()
    employerId: string;

    @IsUUID()
    packageId: string;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export enum SubscriptionStatusInput {
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export class UpdateSubscriptionStatusDto {
    @IsEnum(SubscriptionStatusInput, {
        message: 'status must be EXPIRED or CANCELLED. Use assign() to reactivate.',
    })
    status: SubscriptionStatusInput;
}
