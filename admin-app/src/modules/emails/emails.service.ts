// admin-app/src/modules/emails/emails.service.ts

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MailService } from '@cykruit/mail';
import { EmailCampaignStatus, EmailRecipientType, Prisma } from '@prisma/client';
import { AdminAuditLogger } from '../../common';
import { EmailsRepository } from './emails.repository';
import { CampaignListQueryDto, PreviewEmailDto, SendEmailCampaignDto, TestEmailDto } from './dto/emails.dto';

interface RecipientItem {
    email: string;
    firstName?: string;
    lastName?: string;
}

@Injectable()
export class EmailsService {
    private readonly logger = new Logger(EmailsService.name);

    constructor(
        private readonly repo: EmailsRepository,
        private readonly mailService: MailService,
        private readonly auditLogger: AdminAuditLogger,
    ) {}

    async list(query: CampaignListQueryDto) {
        return this.repo.findCampaigns(query);
    }

    async getById(id: string) {
        const campaign = await this.repo.findCampaignById(id);
        if (!campaign) {
            throw new NotFoundException(`Email campaign ${id} not found`);
        }
        return campaign;
    }

    async preview(dto: PreviewEmailDto) {
        const defaultSampleVars = {
            firstName: 'Alex',
            lastName: 'Taylor',
            email: 'alex.taylor@example.com',
            ...dto.sampleVariables,
        };

        const renderedHtml = this.mailService.renderBroadcastTemplate(
            dto.subject,
            dto.bodyHtml,
            defaultSampleVars,
        );

        return {
            subject: dto.subject,
            renderedHtml,
        };
    }

    async sendTest(adminId: string, dto: TestEmailDto) {
        const sampleVars = {
            firstName: 'Test',
            lastName: 'Admin',
            email: dto.toEmail,
            ...dto.sampleVariables,
        };

        await this.mailService.sendCustomAdminEmail(dto.toEmail, {
            subject: `[TEST] ${dto.subject}`,
            bodyHtml: dto.bodyHtml,
            variables: sampleVars,
        });

        this.auditLogger.log({
            adminId,
            action: 'emails:send',
            module: 'emails',
            resource: 'TestEmail',
            newData: { toEmail: dto.toEmail, subject: dto.subject } as unknown as Prisma.InputJsonValue,
            riskLevel: 'LOW',
            result: 'SUCCESS',
        });

        return {
            data: {
                toEmail: dto.toEmail,
            },
            message: `Test email sent to ${dto.toEmail}`,
        };
    }

    async createAndSendCampaign(adminId: string, dto: SendEmailCampaignDto) {
        let recipients: RecipientItem[] = [];

        if (dto.recipientType === EmailRecipientType.SEGMENT) {
            const segment = dto.segmentTarget || 'ALL';
            const users = await this.repo.findUsersBySegment(segment);
            recipients = users.map((u) => ({
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
            }));
        } else if (dto.recipientType === EmailRecipientType.CUSTOM_LIST) {
            if (!dto.customEmails || dto.customEmails.length === 0) {
                throw new BadRequestException('customEmails array is required when recipientType is CUSTOM_LIST');
            }
            // Deduplicate emails
            const uniqueEmails = Array.from(new Set(dto.customEmails.map((e) => e.trim().toLowerCase())));
            recipients = uniqueEmails.map((email) => ({ email }));
        }

        if (recipients.length === 0) {
            throw new BadRequestException('No valid recipients found for this campaign');
        }

        const campaign = await this.repo.createCampaign({
            subject: dto.subject,
            bodyHtml: dto.bodyHtml,
            recipientType: dto.recipientType,
            segmentTarget: dto.segmentTarget,
            totalRecipients: recipients.length,
            createdById: adminId,
            status: EmailCampaignStatus.QUEUED,
        });

        this.auditLogger.log({
            adminId,
            action: 'emails:send',
            module: 'emails',
            resource: 'AdminEmailCampaign',
            resourceId: campaign.id,
            newData: {
                subject: dto.subject,
                recipientType: dto.recipientType,
                segmentTarget: dto.segmentTarget,
                totalRecipients: recipients.length,
            } as unknown as Prisma.InputJsonValue,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
        });

        // Trigger asynchronous background processing
        this.processCampaignInBackground(campaign.id, recipients, dto.subject, dto.bodyHtml).catch((err) => {
            this.logger.error(`Background campaign ${campaign.id} failed unexpectedly`, err);
        });

        return {
            data: {
                campaignId: campaign.id,
                totalRecipients: recipients.length,
                status: EmailCampaignStatus.QUEUED,
            },
            message: `Email campaign queued for ${recipients.length} recipients.`,
        };
    }

    private async processCampaignInBackground(
        campaignId: string,
        recipients: RecipientItem[],
        subject: string,
        bodyHtml: string,
    ) {
        this.logger.log(`Starting background processing for campaign ${campaignId} (${recipients.length} recipients)`);

        await this.repo.updateCampaignStatus(campaignId, {
            status: EmailCampaignStatus.PROCESSING,
        });

        let sentCount = 0;
        let failedCount = 0;
        const BATCH_SIZE = 10;
        const DELAY_MS = 200; // Rate limit protection between batches

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);

            await Promise.all(
                batch.map(async (recipient) => {
                    const fullName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ');
                    const vars = {
                        firstName: recipient.firstName || 'there',
                        lastName: recipient.lastName || '',
                        fullName: fullName || 'Valued User',
                        email: recipient.email,
                    };

                    try {
                        await this.mailService.sendCustomAdminEmail(recipient.email, {
                            subject,
                            bodyHtml,
                            variables: vars,
                        });

                        sentCount++;
                        await this.repo.recordRecipientLog({
                            campaignId,
                            email: recipient.email,
                            name: fullName || null,
                            status: 'SENT',
                            sentAt: new Date(),
                        });
                    } catch (err: unknown) {
                        failedCount++;
                        const errorMsg = err instanceof Error ? err.message : String(err);
                        this.logger.error(`Failed to send to ${recipient.email}: ${errorMsg}`);
                        await this.repo.recordRecipientLog({
                            campaignId,
                            email: recipient.email,
                            name: fullName || null,
                            status: 'FAILED',
                            error: errorMsg,
                        });
                    }
                }),
            );

            // Update intermediate progress counts
            await this.repo.updateCampaignStatus(campaignId, {
                status: EmailCampaignStatus.PROCESSING,
                sentCount,
                failedCount,
            });

            // Throttle between batches if not last
            if (i + BATCH_SIZE < recipients.length) {
                await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
            }
        }

        let finalStatus: EmailCampaignStatus = EmailCampaignStatus.COMPLETED;
        if (failedCount > 0 && sentCount === 0) {
            finalStatus = EmailCampaignStatus.FAILED;
        } else if (failedCount > 0 && sentCount > 0) {
            finalStatus = EmailCampaignStatus.PARTIALLY_FAILED;
        }

        await this.repo.updateCampaignStatus(campaignId, {
            status: finalStatus,
            sentCount,
            failedCount,
            completedAt: new Date(),
        });

        this.logger.log(
            `Campaign ${campaignId} finished. Sent: ${sentCount}, Failed: ${failedCount}, Final Status: ${finalStatus}`,
        );
    }
}
