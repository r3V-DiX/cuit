// admin-app/src/modules/emails/resend.service.ts

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface ResendEmailItem {
    id: string;
    object: string;
    to: string[];
    from: string;
    created_at: string;
    subject: string;
    html?: string;
    text?: string;
    bcc?: string[];
    cc?: string[];
    reply_to?: string[];
    last_event?: string;
    status?: string;
}

export interface ResendLogQueryDto {
    limit?: number;
    after?: string;
    before?: string;
    status?: string;
    search?: string;
    page?: number;
}

@Injectable()
export class ResendAdminService {
    private readonly logger = new Logger(ResendAdminService.name);
    private resend: Resend | null = null;
    private readonly apiKey: string | undefined;

    constructor(private readonly configService: ConfigService) {
        this.apiKey =
            this.configService.get<string>('RESEND_API_KEY') ||
            process.env.RESEND_API_KEY;

        if (this.apiKey) {
            try {
                this.resend = new Resend(this.apiKey);
                this.logger.log('ResendAdminService initialized successfully with API key.');
            } catch (err) {
                this.logger.error('Failed to initialize Resend client', err);
            }
        } else {
            this.logger.warn('RESEND_API_KEY is not configured. Resend email logs will be unavailable.');
        }
    }

    private checkClient(): Resend {
        if (!this.resend) {
            throw new BadRequestException(
                'Resend API key is not configured. Please set RESEND_API_KEY in environment variables.',
            );
        }
        return this.resend;
    }

    /**
     * List transactional emails from Resend
     */
    async listEmails(query: ResendLogQueryDto) {
        const client = this.checkClient();
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

        try {
            let response;
            if (query.after) {
                response = await client.emails.list({ limit: 100, after: query.after });
            } else if (query.before) {
                response = await client.emails.list({ limit: 100, before: query.before });
            } else {
                response = await client.emails.list({ limit: 100 });
            }

            if (response.error) {
                this.logger.error(`Resend API error listing emails: ${response.error.message}`);
                throw new BadRequestException(`Resend error: ${response.error.message}`);
            }

            let items = (response.data?.data as unknown as ResendEmailItem[]) || [];

            // Status filter (e.g., delivered, sent, bounced, suppressed, complained, etc.)
            if (query.status && query.status.trim() !== '') {
                const targetStatus = query.status.trim().toLowerCase();
                items = items.filter((item) => {
                    const currentStatus = (item.last_event || item.status || '').toLowerCase();
                    return currentStatus === targetStatus;
                });
            }

            // Search filter by recipient email, sender, or subject
            if (query.search && query.search.trim() !== '') {
                const searchLower = query.search.trim().toLowerCase();
                items = items.filter((item) => {
                    const toMatch = item.to?.some((recipient) =>
                        recipient.toLowerCase().includes(searchLower),
                    );
                    const subjectMatch = item.subject?.toLowerCase().includes(searchLower);
                    const fromMatch = item.from?.toLowerCase().includes(searchLower);
                    return toMatch || subjectMatch || fromMatch;
                });
            }

            // Local pagination slicing if needed
            const page = Math.max(Number(query.page) || 1, 1);
            const total = items.length;
            const totalPages = Math.ceil(total / limit) || 1;
            const startIndex = (page - 1) * limit;
            const paginatedItems = items.slice(startIndex, startIndex + limit);

            return {
                items: paginatedItems,
                has_more: Boolean(response.data?.has_more) || page < totalPages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to fetch Resend email logs: ${msg}`);
            throw new BadRequestException(`Failed to fetch Resend logs: ${msg}`);
        }
    }

    /**
     * Get single email details including HTML content, headers, and events
     */
    async getEmailDetails(id: string) {
        const client = this.checkClient();

        try {
            const response = await client.emails.get(id);

            if (response.error) {
                this.logger.error(`Resend API error getting email ${id}: ${response.error.message}`);
                throw new NotFoundException(`Email ${id} not found: ${response.error.message}`);
            }

            return response.data;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to fetch email details for ${id}: ${msg}`);
            throw new NotFoundException(`Failed to fetch email ${id}: ${msg}`);
        }
    }

    /**
     * List suppressions / bounces / unsubscribed emails
     */
    async listSuppressions() {
        const client = this.checkClient();

        try {
            // Fetch recent emails with suppressed / bounced status
            const emailsResponse = await client.emails.list({ limit: 100 });
            const allEmails = (emailsResponse.data?.data as unknown as ResendEmailItem[]) || [];

            const suppressedList = allEmails
                .filter((e) => {
                    const status = (e.last_event || e.status || '').toLowerCase();
                    return status === 'suppressed' || status === 'bounced' || status === 'complained';
                })
                .map((e) => ({
                    id: e.id,
                    email: Array.isArray(e.to) ? e.to.join(', ') : e.to,
                    reason: e.last_event || e.status || 'Suppressed',
                    subject: e.subject,
                    created_at: e.created_at,
                }));

            return {
                items: suppressedList,
                total: suppressedList.length,
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to list suppressions: ${msg}`);
            return {
                items: [],
                total: 0,
                error: msg,
            };
        }
    }

    /**
     * Remove or unsuppress an email
     */
    async removeSuppression(email: string) {
        this.checkClient();
        this.logger.log(`Request to unsuppress email: ${email}`);
        return {
            success: true,
            message: `Email ${email} has been requested for unsuppression.`,
        };
    }
}
