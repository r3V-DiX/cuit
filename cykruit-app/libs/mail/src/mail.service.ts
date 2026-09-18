// libs/mail/mail.service.ts
import { Injectable, InternalServerErrorException, OnModuleInit } from "@nestjs/common";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
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
import { broadcastTemplate } from "./templates/broadcast.template";
import { subscriptionInvoiceTemplate } from "./templates/subscription-invoice.template";
import { adminNotificationTemplate } from "./templates/admin-notification.template";
import { generateInvoicePdf, InvoicePdfData } from "./invoice/generate-invoice-pdf";

@Injectable()
export class MailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;
  private adminUrl: string;
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
    // Robust APP_URL resolution — `??` only catches null/undefined, so an empty
    // or bare "http://" value would produce broken links in emails. Fall back
    // unless the value is a real absolute http(s) URL, then strip trailing slash.
    const rawAppUrl = this.configService.get<string>("APP_URL") || "";
    this.frontendUrl = /^https?:\/\/.+/.test(rawAppUrl)
      ? rawAppUrl.replace(/\/+$/, "")
      : "http://localhost:3000";
    const rawAdminUrl = this.configService.get<string>("ADMIN_URL") || "";
    this.adminUrl = /^https?:\/\/.+/.test(rawAdminUrl)
      ? rawAdminUrl.replace(/\/+$/, "")
      : "http://localhost:3100";
    this.isDev = this.configService.get<string>("NODE_ENV") !== "production";
  }

  /** Notification actionUrls arrive as relative paths (e.g. "/employer/jobs/:id") —
   *  resolve them against the given base so email clients get a real absolute link
   *  instead of a bare path with no domain. Already-absolute URLs pass through untouched. */
  private resolveActionUrl(actionUrl: string | undefined, base: string): string | undefined {
    if (!actionUrl) return undefined;
    if (/^https?:\/\//.test(actionUrl)) return actionUrl;
    return `${base}${actionUrl.startsWith("/") ? "" : "/"}${actionUrl}`;
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
      const resolvedActionUrl = this.resolveActionUrl(actionUrl, this.frontendUrl);
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: "New notification from Cykruit",
        text: `${firstName ? `Hi ${firstName},\n\n` : ""}${message}${resolvedActionUrl ? `\n\nView details: ${resolvedActionUrl}` : ""}\n\n-- Cykruit Team`,
        html: notificationTemplate(message, resolvedActionUrl, firstName),
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

  async sendAdminNotificationEmail(
    email: string,
    title: string,
    message: string,
    actionUrl?: string,
    firstName?: string,
  ): Promise<void> {
    try {
      const resolvedActionUrl = this.resolveActionUrl(actionUrl, this.adminUrl);
      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to: email,
        subject: `[Admin] ${title}`,
        text: `${firstName ? `Hi ${firstName},\n\n` : ""}${message}${resolvedActionUrl ? `\n\nView details: ${resolvedActionUrl}` : ""}\n\n-- Cykruit Team`,
        html: adminNotificationTemplate(title, message, resolvedActionUrl, firstName),
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Admin notification email sent to ${email}`, "MailService");
    } catch (err) {
      this.logger.error(
        "Failed to send admin notification email",
        err,
        "MailService",
      );
      throw new InternalServerErrorException(
        "Failed to send admin notification email",
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
      const safeName    = escapeHtml(data.fullName);
      const safeEmail   = escapeHtml(data.email);
      const safeMessage = escapeHtml(data.message);
      const safeIp      = escapeHtml(data.ipAddress || 'unknown');
      const safeUa      = escapeHtml(data.userAgent || 'unknown');

      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: data.email,
        to,
        subject: `Contact form: ${safeName}`,
        html: `
                    <div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
                      <h2 style="color:#1B3C8B;margin-top:0;">New Contact Form Submission</h2>
                      <p><strong>From:</strong> ${safeName}</p>
                      <p><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color:#1B3C8B;">${safeEmail}</a></p>
                      <p><strong>Message:</strong></p>
                      <div style="background:#f1f5f9;padding:16px;border-radius:8px;white-space:pre-wrap;border-left:4px solid #1B3C8B;margin:15px 0;">${safeMessage}</div>
                      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>
                      <p style="font-size:12px;color:#64748b;margin:0;">
                        <strong>IP Address:</strong> ${safeIp}<br/>
                        <strong>User Agent:</strong> ${safeUa}
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

  async sendSubscriptionInvoiceEmail(
    to: string,
    data: {
      firstName: string;
      packageName: string;
      billingCycle: string;
      invoice: InvoicePdfData;
    },
  ): Promise<void> {
    try {
      const subscriptionUrl = `${this.frontendUrl}/employer/subscription`;
      const pdfBuffer = await generateInvoicePdf(data.invoice);
      const totalPaid = data.invoice.currency === 'INR'
        ? `Rs. ${(data.invoice.totalAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `${data.invoice.currency} ${(data.invoice.totalAmountPaise / 100).toFixed(2)}`;

      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject: `Invoice ${data.invoice.invoiceNumber} — ${data.packageName} plan`,
        text: `Hi ${data.firstName},\n\nYour payment for the ${data.packageName} plan (${data.billingCycle}) was received. Invoice ${data.invoice.invoiceNumber} for ${totalPaid} is attached.\n\nManage your subscription: ${subscriptionUrl}\n\n-- Cykruit Team`,
        html: subscriptionInvoiceTemplate({
          firstName: data.firstName,
          invoiceNumber: data.invoice.invoiceNumber,
          packageName: data.packageName,
          billingCycle: data.billingCycle,
          totalPaid,
          subscriptionUrl,
        }),
        attachments: [
          {
            filename: `${data.invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (error) throw new Error(error.message);
      this.logger.log(`Subscription invoice email sent to ${to}`, "MailService");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send subscription invoice email to ${to}: ${message}`,
        err instanceof Error ? err.stack : undefined,
        "MailService",
      );
      throw new InternalServerErrorException("Failed to send subscription invoice email");
    }
  }

  renderBroadcastTemplate(
    subject: string,
    contentHtml: string,
    variables?: Record<string, string>,
  ): string {
    let interpolatedSubject = subject;
    let interpolatedContent = contentHtml;

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        interpolatedSubject = interpolatedSubject.replace(regex, value ?? "");
        interpolatedContent = interpolatedContent.replace(regex, value ?? "");
      }
    }

    return broadcastTemplate(interpolatedSubject, interpolatedContent);
  }

  async sendCustomAdminEmail(
    to: string,
    data: {
      subject: string;
      bodyHtml: string;
      variables?: Record<string, string>;
    },
  ): Promise<void> {
    try {
      let interpolatedSubject = data.subject;
      let interpolatedContent = data.bodyHtml;

      if (data.variables) {
        for (const [key, value] of Object.entries(data.variables)) {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
          interpolatedSubject = interpolatedSubject.replace(regex, value ?? "");
          interpolatedContent = interpolatedContent.replace(regex, value ?? "");
        }
      }

      const html = broadcastTemplate(interpolatedSubject, interpolatedContent);

      if (this.isDev) {
        this.logger.debug(
          `[DEV] Custom admin email queued for ${to} | Subject: "${interpolatedSubject}"`,
          "MailService",
        );
      }

      const { error } = await this.resend.emails.send({
        from: `Cykruit <${this.fromEmail}>`,
        replyTo: "support@cykruit.com",
        to,
        subject: interpolatedSubject,
        html,
      });

      if (error) throw new Error(error.message);
      this.logger.log(
        `Custom admin email sent to ${to} | Subject: "${interpolatedSubject}"`,
        "MailService",
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Failed to send custom admin email to ${to}: ${message}`,
        stack,
        "MailService",
      );
      throw new InternalServerErrorException(
        `Failed to send custom email to ${to}: ${message}`,
      );
    }
  }
}
