"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
// libs/mail/mail.service.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
const logger_1 = require("@cykruit/logger");
const verification_template_1 = require("./templates/verification.template");
const password_reset_template_1 = require("./templates/password-reset.template");
const password_changed_template_1 = require("./templates/password-changed.template");
const notification_template_1 = require("./templates/notification.template");
const account_deletion_scheduled_template_1 = require("./templates/account-deletion-scheduled.template");
const otp_template_1 = require("./templates/otp.template");
const employer_invite_template_1 = require("./templates/employer-invite.template");
const company_join_request_template_1 = require("./templates/company-join-request.template");
let MailService = class MailService {
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        const resendApiKey = this.configService.get("RESEND_API_KEY");
        const emailFrom = this.configService.get("EMAIL_FROM");
        if (!resendApiKey || !emailFrom) {
            throw new Error("RESEND_API_KEY and EMAIL_FROM must be set in .env");
        }
        this.resend = new resend_1.Resend(resendApiKey);
        this.fromEmail = emailFrom;
        this.frontendUrl =
            this.configService.get("APP_URL") || "http://localhost:3000";
    }
    async sendVerificationEmail(email, verifyUrl) {
        try {
            if (process.env.NODE_ENV !== "production") {
                this.logger.log(`[DEV] Verification URL for ${email}: ${verifyUrl}`, "MailService");
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to: email,
                subject: "Verify your Cykruit account",
                html: (0, verification_template_1.verificationTemplate)(verifyUrl),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Verification email sent to ${email}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send verification email", err, "MailService");
            throw new common_1.InternalServerErrorException("Failed to send verification email");
        }
    }
    async sendPasswordResetEmail(email, resetUrl) {
        try {
            if (process.env.NODE_ENV !== "production") {
                this.logger.log(`[DEV] Password Reset URL for ${email}: ${resetUrl}`, "MailService");
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to: email,
                subject: "Reset Your Cykruit Password",
                html: (0, password_reset_template_1.passwordResetTemplate)(resetUrl),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Password reset email sent to ${email}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send password reset email", err, "MailService");
            throw new common_1.InternalServerErrorException("Failed to send password reset email");
        }
    }
    async sendPasswordChangedEmail(email, firstName) {
        try {
            const loginUrl = `${this.frontendUrl}/login`;
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to: email,
                subject: "✅ Password Successfully Changed",
                html: (0, password_changed_template_1.passwordChangedTemplate)(firstName, loginUrl),
            });
            if (error)
                this.logger.error("Failed to send password changed email", error.message, "MailService");
            else
                this.logger.log(`Password changed email sent to ${email}`, "MailService");
        }
        catch (err) {
            // Don't throw — password is already changed
            this.logger.error("Failed to send password changed email", err, "MailService");
        }
    }
    async sendNotificationEmail(email, message, actionUrl, firstName) {
        try {
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to: email,
                subject: "🔔 You have a new notification",
                html: (0, notification_template_1.notificationTemplate)(message, actionUrl, firstName),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Notification email sent to ${email}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send notification email", err, "MailService");
            throw new common_1.InternalServerErrorException("Failed to send notification email");
        }
    }
    // ✅ NEW: Sends a confirmation email when account deletion is scheduled
    // Not thrown on failure — deletion is already scheduled, email is best-effort
    async sendAccountDeletionScheduledEmail(email, deletionScheduledAt) {
        try {
            const loginUrl = `${this.frontendUrl}/login`;
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to: email,
                subject: "⚠️ Your Cykruit Account is Scheduled for Deletion",
                html: (0, account_deletion_scheduled_template_1.accountDeletionScheduledTemplate)(deletionScheduledAt, loginUrl),
            });
            if (error) {
                this.logger.error("Failed to send account deletion scheduled email", error.message, "MailService");
            }
            else {
                this.logger.log(`Account deletion scheduled email sent to ${email}`, "MailService");
            }
        }
        catch (err) {
            // Don't throw — deletion is already scheduled, this is best-effort
            this.logger.error("Failed to send account deletion scheduled email", err, "MailService");
        }
    }
    async sendOtp(to, data) {
        try {
            if (process.env.NODE_ENV !== "production") {
                this.logger.log(`[DEV] OTP Code for ${to}: ${data.otp}`, "MailService");
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to,
                subject: "Your Cykruit verification code",
                html: (0, otp_template_1.otpTemplate)(data.firstName, data.otp, data.expiresInMinutes, data.purpose),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`OTP email sent to ${to}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send OTP email", err, "MailService");
            throw new common_1.InternalServerErrorException("Failed to send OTP email");
        }
    }
    async sendEmployerInvite(to, data) {
        try {
            if (process.env.NODE_ENV !== "production") {
                this.logger.log(`[DEV] Employer invite URL for ${to}: ${data.inviteUrl}`, "MailService");
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to,
                subject: `You've been invited to join ${data.companyName} on Cykruit`,
                html: (0, employer_invite_template_1.employerInviteTemplate)(data.inviteeName, data.inviterName, data.companyName, data.companyLogo, data.assignedRole, data.inviteUrl, data.expiresInHours),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Employer invite email sent to ${to}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send employer invite email", err, "MailService");
            throw new common_1.InternalServerErrorException("Failed to send employer invite email");
        }
    }
    async sendCompanyJoinRequest(to, data) {
        try {
            if (process.env.NODE_ENV !== "production") {
                this.logger.log(`[DEV] Join request dashboard URL for ${to}: ${data.dashboardUrl}`, "MailService");
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: "support@cykruit.com",
                to,
                subject: `Someone from ${data.requesterEmail.split("@")[1]} wants to join ${data.companyName}`,
                html: (0, company_join_request_template_1.companyJoinRequestTemplate)(data.ownerFirstName, data.requesterName, data.requesterEmail, data.companyName, data.dashboardUrl),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Company join request email sent to ${to}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send company join request email", err, "MailService");
            throw new common_1.InternalServerErrorException("Failed to send company join request email");
        }
    }
    async sendContactFormNotification(to, data) {
        try {
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: data.email,
                to,
                subject: `🔔 New Contact Form: ${data.fullName}`,
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
            if (error)
                throw new Error(error.message);
            this.logger.log(`Contact form notification email sent to ${to}`, "MailService");
        }
        catch (err) {
            this.logger.error("Failed to send contact form notification email", err, "MailService");
            // Don't throw — contact form is saved in DB, so this is best-effort
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.AppLogger,
        config_1.ConfigService])
], MailService);
