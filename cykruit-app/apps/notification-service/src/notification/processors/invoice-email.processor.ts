// apps/notification-service/src/notification/processors/invoice-email.processor.ts

import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { AppLogger } from '@cykruit/logger';
import { MailService } from '@cykruit/mail';
import { PrismaService } from '@cykruit/prisma';
import { NOTIFICATION_QUEUE } from '../constants';
import { NOTIFICATION_JOBS } from '../services/notification.service';

interface SendInvoiceEmailJobData {
    orderId: string;
}

@Processor(NOTIFICATION_QUEUE)
export class InvoiceEmailProcessor {
    constructor(
        private readonly mailService: MailService,
        private readonly prisma: PrismaService,
        private readonly logger: AppLogger,
    ) {}

    @Process(NOTIFICATION_JOBS.SEND_INVOICE_EMAIL)
    async handleSendInvoiceEmail(job: Job<SendInvoiceEmailJobData>): Promise<void> {
        const { orderId } = job.data;

        const order = await this.prisma.paymentOrder.findUnique({
            where: { id: orderId },
            select: {
                billingCycle: true,
                amountPaise: true,
                discountAmountPaise: true,
                gstAmountPaise: true,
                totalAmountPaise: true,
                currency: true,
                createdAt: true,
                package: { select: { name: true } },
                employer: {
                    select: {
                        companyName: true,
                        location: true,
                        user: { select: { email: true, firstName: true } },
                    },
                },
                payment: { select: { invoiceNumber: true, razorpayPaymentId: true, capturedAt: true } },
            },
        });

        if (!order || !order.payment?.invoiceNumber) {
            this.logger.warn(
                `Invoice email skipped — order or invoice number missing for orderId=${orderId}`,
                'InvoiceEmailProcessor',
            );
            return;
        }

        try {
            await this.mailService.sendSubscriptionInvoiceEmail(order.employer.user.email, {
                firstName: order.employer.user.firstName,
                packageName: order.package.name,
                billingCycle: order.billingCycle,
                invoice: {
                    invoiceNumber: order.payment.invoiceNumber,
                    invoiceDate: order.payment.capturedAt ?? order.createdAt,
                    companyName: order.employer.companyName,
                    companyLocation: order.employer.location,
                    packageName: order.package.name,
                    billingCycle: order.billingCycle,
                    currency: order.currency,
                    baseAmountPaise: order.amountPaise,
                    discountAmountPaise: order.discountAmountPaise,
                    gstAmountPaise: order.gstAmountPaise,
                    totalAmountPaise: order.totalAmountPaise,
                    razorpayPaymentId: order.payment.razorpayPaymentId,
                },
            });
            this.logger.log(
                `Invoice email sent to ${order.employer.user.email} for orderId=${orderId}`,
                'InvoiceEmailProcessor',
            );
        } catch (err) {
            this.logger.error(
                `Failed to send invoice email for orderId=${orderId}`,
                err,
                'InvoiceEmailProcessor',
            );
            throw err; // Rethrow so Bull retries
        }
    }
}
