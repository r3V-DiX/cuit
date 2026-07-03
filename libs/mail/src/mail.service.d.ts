import { ConfigService } from "@nestjs/config";
import { AppLogger } from "@cykruit/logger";
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
  sendNotificationEmail(
    email: string,
    message: string,
    actionUrl?: string,
    firstName?: string,
  ): Promise<void>;
  sendAccountDeletionScheduledEmail(
    email: string,
    deletionScheduledAt: Date,
  ): Promise<void>;
  sendOtp(
    to: string,
    data: {
      firstName: string;
      otp: string;
      expiresInMinutes: number;
      purpose: string;
    },
  ): Promise<void>;
  sendEmployerInvite(
    to: string,
    data: {
      inviteeName: string;
      inviterName: string;
      companyName: string;
      companyLogo: string | null;
      assignedRole: "Hiring Manager" | "Recruiter";
      inviteUrl: string;
      expiresInHours: number;
    },
  ): Promise<void>;
  sendCompanyJoinRequest(
    to: string,
    data: {
      ownerFirstName: string;
      requesterName: string;
      requesterEmail: string;
      companyName: string;
      dashboardUrl: string;
    },
  ): Promise<void>;
  sendContactFormNotification(
    to: string,
    data: {
      fullName: string;
      email: string;
      message: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void>;
}
