// libs/mail/mail.service.ts
import { Injectable, InternalServerErrorException, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { AppLogger } from "@cykruit/logger";
import { verificationTemplate } from "./templates/verification.template";
import { passwordResetTemplate } from "./templates/password-reset.template";
import { passwordChangedTemplate } from "./templates/password-changed.template";
import { notificationTemplate } from "./templates/notification.template";
import { accountDeletionScheduledTemplate } from "./templates/account-deletion-scheduled.template";
import { otpTemplate } from "./templates/otp.template";
import { employerInviteTemplate } from "./templates/employer-invite.template";
import { companyJoinRequestTemplate } from "./templates/company-join-request.template";
import { adminInviteTemplate } from "./templates/admin-invite.template";
import { jobReviewTemplate } from "./templates/job-review.template";

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;
  private readonly isDev: boolean;

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    const resendApiKey = this.configService.get<string>("RESEND_API_KEY");
    const emailFrom = this.configService.get<string>("EMAIL_FROM");

    if (!resendApiKey || !emailFrom) {
      throw new InternalServerErrorException("RESEND_API_KEY and EMAIL_FROM must be set in .env");
    }

    this.resend = new Resend(resendApiKey);
    this.fromEmail = emailFrom;
    this.frontendUrl =
      this.configService.get<string>("APP_URL") ?? "http://localhost:3000";
    this.isDev = this.configService.get<string>("NODE_ENV") !== "production";
  }

  async sendVerificationEmail(email: string, verifyUrl: string): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.debug(`[DEV] Verification email queued for ${email}`, "MailService");
      }
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: "Verify your email address",
        text: `Verify your Cykruit account\n\nClick this link to verify: ${verifyUrl}\n\nLink expires in 24 hours. If you didn't sign up, ignore this email.\n\n-- Cykruit Team`,
        html: verificationTemplate(verifyUrl),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Verification email sent to ${email}`, "MailService");
    } catch (err) {
      this.logger.error(
        "Failed to send verification email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send verification email",
      );
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.debug(`[DEV] Password reset email queued for ${email}`, "MailService");
      }
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: "Reset your password",
        text: `Password reset request\n\nClick to reset your password: ${resetUrl}\n\nThis link expires in 1 hour. Didn't request this? Ignore this email.\n\n-- Cykruit Team`,
        html: passwordResetTemplate(resetUrl),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Password reset email sent to ${email}`, "MailService");
    } catch (err) {
      this.logger.error(
        "Failed to send password reset email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send password reset email",
      );
    }
  }

  async sendPasswordChangedEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    try {
      const loginUrl = `${this.frontendUrl}/login`;
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: "Your password was changed",
        text: `Password updated\n\nHi ${firstName}, your Cykruit password was successfully changed.\n\nIf you didn't make this change, contact support@cykruit.com immediately.\n\n-- Cykruit Team`,
        html: passwordChangedTemplate(firstName, loginUrl),
      });

      if (error)
        this.logger.error(
          "Failed to send password changed email",
          error.message,
          "MailService",
        );
      else
        this.logger.log(
          `Password changed email sent to ${email}`,
          "MailService",
        );
    } catch (err) {
      // Don't throw — password is already changed
      this.logger.error(
        "Failed to send password changed email",
        err,
        "MailService",
      );
    }
  }

  async sendNotificationEmail(
    email: string,
    message: string,
    actionUrl?: string,
    firstName?: string,
  ): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: "New notification from Cykruit",
        text: `${firstName ? `Hi ${firstName},\n\n` : ""}${message}${actionUrl ? `\n\nView details: ${actionUrl}` : ""}\n\n-- Cykruit Team`,
        html: notificationTemplate(message, actionUrl, firstName),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Notification email sent to ${email}`, "MailService");
    } catch (err) {
      this.logger.error(
        "Failed to send notification email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send notification email",
      );
    }
  }

  // ✅ NEW: Sends a confirmation email when account deletion is scheduled
  // Not thrown on failure — deletion is already scheduled, email is best-effort
  async sendAccountDeletionScheduledEmail(
    email: string,
    deletionScheduledAt: Date,
  ): Promise<void> {
    try {
      const loginUrl = `${this.frontendUrl}/login`;
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: "Your account is scheduled for deletion",
        text: `Account deletion scheduled\n\nYour Cykruit account will be permanently deleted on ${deletionScheduledAt.toDateString()}.\n\nTo cancel: log in before that date at ${this.frontendUrl}/login\n\nIf you didn't request this, contact support@cykruit.com\n\n-- Cykruit Team`,
        html: accountDeletionScheduledTemplate(deletionScheduledAt, loginUrl),
      });

      if (error) {
        this.logger.error(
          "Failed to send account deletion scheduled email",
          error.message,
          "MailService",
        );
      } else {
        this.logger.log(
          `Account deletion scheduled email sent to ${email}`,
          "MailService",
        );
      }
    } catch (err) {
      // Don't throw — deletion is already scheduled, this is best-effort
      this.logger.error(
        "Failed to send account deletion scheduled email",
        err,
        "MailService",
      );
    }
  }

  async sendOtp(
    to: string,
    data: {
      firstName: string;
      otp: string;
      expiresInMinutes: number;
      purpose: string;
    },
  ): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.debug(`[DEV] OTP email queued for ${to} | OTP: ${data.otp}`, "MailService");
      }
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject: "Your verification code",
        text: `Hi ${data.firstName || "there"},\n\nYour Cykruit verification code: ${data.otp}\n\nExpires in ${data.expiresInMinutes} minutes. Do not share this code.\n\n-- Cykruit Team`,
        html: otpTemplate(
          data.firstName,
          data.otp,
          data.expiresInMinutes,
          data.purpose,
        ),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`OTP email sent to ${to}`, "MailService");
    } catch (err) {
      this.logger.error("Failed to send OTP email", err, "MailService");
      throw new InternalServerErrorException("Failed to send OTP email");
    }
  }

  async sendEmployerInvite(
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
  ): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.log(
          `[DEV] Employer invite email queued for ${to}`,
          "MailService",
        );
      }
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject: `Invitation to join ${data.companyName} on Cykruit`,
        text: `Hi ${data.inviteeName},\n\n${data.inviterName} has invited you to join ${data.companyName} on Cykruit as ${data.assignedRole}.\n\nAccept invite: ${data.inviteUrl}\n\nExpires in ${data.expiresInHours} hours.\n\n-- Cykruit Team`,
        html: employerInviteTemplate(
          data.inviteeName,
          data.inviterName,
          data.companyName,
          data.companyLogo,
          data.assignedRole,
          data.inviteUrl,
          data.expiresInHours,
        ),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Employer invite email sent to ${to}`, "MailService");
    } catch (err) {
      this.logger.error(
        "Failed to send employer invite email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send employer invite email",
      );
    }
  }

  async sendAdminInvite(
    to: string,
    data: {
      inviteeEmail: string;
      inviterName: string;
      inviteUrl: string;
      expiresInHours: number;
    },
  ): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.log(
          `[DEV] Admin invite email queued for ${to}`,
          "MailService",
        );
      }
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject: "Invitation to join the Cykruit admin console",
        text: `Hi,\n\n${data.inviterName} has invited you to join the Cykruit admin console.\n\nAccept invite: ${data.inviteUrl}\n\nExpires in ${data.expiresInHours} hours.\n\n-- Cykruit Team`,
        html: adminInviteTemplate(
          data.inviteeEmail,
          data.inviterName,
          data.inviteUrl,
          data.expiresInHours,
        ),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Admin invite email sent to ${to}`, "MailService");
    } catch (err) {
      this.logger.error(
        "Failed to send admin invite email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send admin invite email",
      );
    }
  }

  async sendCompanyJoinRequest(
    to: string,
    data: {
      ownerFirstName: string;
      requesterName: string;
      requesterEmail: string;
      companyName: string;
      dashboardUrl: string;
    },
  ): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.log(
          `[DEV] Join request email queued for ${to}`,
          "MailService",
        );
      }
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject: `${data.requesterName} wants to join your team on Cykruit`,
        text: `Hi ${data.ownerFirstName},\n\n${data.requesterName} (${data.requesterEmail}) has requested to join ${data.companyName} on Cykruit.\n\nReview in dashboard: ${data.dashboardUrl}\n\n-- Cykruit Team`,
        html: companyJoinRequestTemplate(
          data.ownerFirstName,
          data.requesterName,
          data.requesterEmail,
          data.companyName,
          data.dashboardUrl,
        ),
      });

      if (error) throw new Error(error.message);
      this.logger.log(
        `Company join request email sent to ${to}`,
        "MailService",
      );
    } catch (err) {
      this.logger.error(
        "Failed to send company join request email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send company join request email",
      );
    }
  }

  async sendContactFormNotification(
    to: string,
    data: {
      fullName: string;
      email: string;
      message: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: data.email,
        to,
        subject: `Contact form: ${data.fullName}`,
        html: `
                    <div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
                      <h2 style="color:#1B3C8B;margin-top:0;">New Contact Form Submission</h2>
                      <p><strong>From:</strong> ${data.fullName}</p>
                      <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color:#1B3C8B;">${data.email}</a></p>
                      <p><strong>Message:</strong></p>
                      <div style="background:#f1f5f9;padding:16px;border-radius:8px;white-space:pre-wrap;border-left:4px solid #1B3C8B;margin:15px 0;">${data.message}</div>
                      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>
                      <p style="font-size:12px;color:#64748b;margin:0;">
                        <strong>IP Address:</strong> ${data.ipAddress || "unknown"}<br/>
                        <strong>User Agent:</strong> ${data.userAgent || "unknown"}
                      </p>
                    </div>
                `,
      });
      if (error) throw new Error(error.message);
      this.logger.log(
        `Contact form notification email sent to ${to}`,
        "MailService",
      );
    } catch (err) {
      this.logger.error(
        "Failed to send contact form notification email",
        err,
        "MailService",
      );
      // Don't throw — contact form is saved in DB, so this is best-effort
    }
  }

  async sendJobReviewNotification(
    to: string,
    data: {
      adminFirstName: string;
      jobTitle: string;
      companyName: string;
      jobType: string;
      workMode: string;
      isResubmission: boolean;
      reviewUrl: string;
    },
  ): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.log(
          `[DEV] Job review notification queued for ${to} — "${data.jobTitle}"`,
          "MailService",
        );
      }
      const subject = data.isResubmission
        ? `Re-review required: ${data.jobTitle} at ${data.companyName}`
        : `New job pending review: ${data.jobTitle} at ${data.companyName}`;

      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject,
        text: `Hi ${data.adminFirstName},\n\nA job listing ${data.isResubmission ? "was edited and needs re-approval" : "is waiting for review"}.\n\nJob: ${data.jobTitle}\nCompany: ${data.companyName}\n\nReview: ${data.reviewUrl}\n\n-- Cykruit Team`,
        html: jobReviewTemplate(data),
      });

      if (error) throw new Error(error.message);
      this.logger.log(
        `Job review notification sent to ${to} for job "${data.jobTitle}"`,
        "MailService",
      );
    } catch (err) {
      this.logger.error(
        "Failed to send job review notification",
        err,
        "MailService",
      );
      // Fire-and-forget — don't block job submit on email failure
    }
  }
}
