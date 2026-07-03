import { ConfigService } from '@nestjs/config';
import { AppLogger } from '@cykruit/logger';
export declare class MailService {
    private readonly logger;
    private readonly configService;
    private resend;
    private fromEmail;
    private frontendUrl;
    constructor(logger: AppLogger, configService: ConfigService);
    sendVerificationEmail(email: string, verifyUrl: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
    sendPasswordChangedEmail(email: string, firstName: string): Promise<void>;
    sendNotificationEmail(email: string, message: string, actionUrl?: string, firstName?: string): Promise<void>;
    sendAccountDeletionScheduledEmail(email: string, deletionScheduledAt: Date): Promise<void>;
}
