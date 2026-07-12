// apps/subscription-service/src/subscription/dto/payment.dto.ts

import { IsEnum, IsUUID, IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export enum BillingCycleInput {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
}

export class CreateOrderDto {
    @IsUUID()
    packageId: string;

    @IsEnum(BillingCycleInput)
    billingCycle: BillingCycleInput;

    @IsOptional()
    @IsString()
    @Length(1, 50)
    couponCode?: string;
}

export class VerifyPaymentDto {
    @IsString()
    @IsNotEmpty()
    razorpayOrderId: string;

    @IsString()
    @IsNotEmpty()
    razorpayPaymentId: string;

    @IsString()
    @IsNotEmpty()
    razorpaySignature: string;
}
