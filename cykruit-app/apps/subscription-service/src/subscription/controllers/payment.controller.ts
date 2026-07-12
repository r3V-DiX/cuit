// apps/subscription-service/src/subscription/controllers/payment.controller.ts

import {
    Controller,
    Get,
    Post,
    Body,
    Req,
    Headers,
    HttpCode,
    HttpStatus,
    UseGuards,
    RawBodyRequest,
    UnprocessableEntityException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard, CurrentUser, Public } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { PaymentService } from '../services/payment.service';
import { CreateOrderDto } from '../dto/payment.dto';

@Controller('subscriptions')
export class PaymentController {

    constructor(private readonly paymentService: PaymentService) {}

    /** POST /subscriptions/orders — create Razorpay order */
    @Post('orders')
    @UseGuards(AuthGuard)
    createOrder(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
        return this.paymentService.createOrder(user.id, dto);
    }

    /** GET /subscriptions/orders — employer's payment order history */
    @Get('orders')
    @UseGuards(AuthGuard)
    getMyOrders(@CurrentUser() user: User) {
        return this.paymentService.getMyOrders(user.id);
    }

    /** POST /subscriptions/webhook — Razorpay webhook (public, signature-verified) */
    @Post('webhook')
    @Public()
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        if (!req.rawBody) {
            throw new UnprocessableEntityException('Raw body required');
        }
        if (!signature) {
            throw new UnprocessableEntityException('Missing x-razorpay-signature header');
        }
        await this.paymentService.handleWebhook(req.rawBody, signature);
        return { received: true };
    }
}
