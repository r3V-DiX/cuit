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
let MailService = class MailService {
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        const resendApiKey = this.configService.get('RESEND_API_KEY');
        const emailFrom = this.configService.get('EMAIL_FROM');
        if (!resendApiKey || !emailFrom) {
            throw new Error('RESEND_API_KEY and EMAIL_FROM must be set in .env');
        }
        this.resend = new resend_1.Resend(resendApiKey);
        this.fromEmail = emailFrom;
        this.frontendUrl = this.configService.get('APP_URL') || 'http://localhost:3000';
    }
    async sendVerificationEmail(email, verifyUrl) {
        try {
            if (process.env.NODE_ENV !== 'production') {
                this.logger.log(`[DEV] Verification URL for ${email}: ${verifyUrl}`, 'MailService');
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: 'Verify your Cykruit account',
                html: (0, verification_template_1.verificationTemplate)(verifyUrl),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Verification email sent to ${email}`, 'MailService');
        }
        catch (err) {
            this.logger.error('Failed to send verification email', err, 'MailService');
            throw new common_1.InternalServerErrorException('Failed to send verification email');
        }
    }
    async sendPasswordResetEmail(email, resetUrl) {
        try {
            if (process.env.NODE_ENV !== 'production') {
                this.logger.log(`[DEV] Password Reset URL for ${email}: ${resetUrl}`, 'MailService');
            }
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: 'Reset Your Cykruit Password',
                html: (0, password_reset_template_1.passwordResetTemplate)(resetUrl),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Password reset email sent to ${email}`, 'MailService');
        }
        catch (err) {
            this.logger.error('Failed to send password reset email', err, 'MailService');
            throw new common_1.InternalServerErrorException('Failed to send password reset email');
        }
    }
    async sendPasswordChangedEmail(email, firstName) {
        try {
            const loginUrl = `${this.frontendUrl}/login`;
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: '✅ Password Successfully Changed',
                html: (0, password_changed_template_1.passwordChangedTemplate)(firstName, loginUrl),
            });
            if (error)
                this.logger.error('Failed to send password changed email', error.message, 'MailService');
            else
                this.logger.log(`Password changed email sent to ${email}`, 'MailService');
        }
        catch (err) {
            // Don't throw — password is already changed
            this.logger.error('Failed to send password changed email', err, 'MailService');
        }
    }
    async sendNotificationEmail(email, message, actionUrl, firstName) {
        try {
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: '🔔 You have a new notification',
                html: (0, notification_template_1.notificationTemplate)(message, actionUrl, firstName),
            });
            if (error)
                throw new Error(error.message);
            this.logger.log(`Notification email sent to ${email}`, 'MailService');
        }
        catch (err) {
            this.logger.error('Failed to send notification email', err, 'MailService');
            throw new common_1.InternalServerErrorException('Failed to send notification email');
        }
    }
    // ✅ NEW: Sends a confirmation email when account deletion is scheduled
    // Not thrown on failure — deletion is already scheduled, email is best-effort
    async sendAccountDeletionScheduledEmail(email, deletionScheduledAt) {
        try {
            const loginUrl = `${this.frontendUrl}/login`;
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: '⚠️ Your Cykruit Account is Scheduled for Deletion',
                html: (0, account_deletion_scheduled_template_1.accountDeletionScheduledTemplate)(deletionScheduledAt, loginUrl),
            });
            if (error) {
                this.logger.error('Failed to send account deletion scheduled email', error.message, 'MailService');
            }
            else {
                this.logger.log(`Account deletion scheduled email sent to ${email}`, 'MailService');
            }
        }
        catch (err) {
            // Don't throw — deletion is already scheduled, this is best-effort
            this.logger.error('Failed to send account deletion scheduled email', err, 'MailService');
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_1.AppLogger,
        config_1.ConfigService])
], MailService);
