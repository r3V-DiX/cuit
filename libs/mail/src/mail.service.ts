// libs/mail/mail.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AppLogger } from '@cykruit/logger';
import { verificationTemplate } from './templates/verification.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { passwordChangedTemplate } from './templates/password-changed.template';
import { notificationTemplate } from './templates/notification.template';
import { accountDeletionScheduledTemplate } from './templates/account-deletion-scheduled.template';

@Injectable()
export class MailService {
    private resend: Resend;
    private fromEmail: string;
    private frontendUrl: string;

    constructor(
        private readonly logger: AppLogger,
        private readonly configService: ConfigService,
    ) {
        const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
        const emailFrom = this.configService.get<string>('EMAIL_FROM');

        if (!resendApiKey || !emailFrom) {
            throw new Error('RESEND_API_KEY and EMAIL_FROM must be set in .env');
        }

        this.resend = new Resend(resendApiKey);
        this.fromEmail = emailFrom;
        this.frontendUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    }

    async sendVerificationEmail(email: string, verifyUrl: string): Promise<void> {
        try {
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: 'Verify your Cykruit account',
                html: verificationTemplate(verifyUrl),
            });

            if (error) throw new Error(error.message);
            this.logger.log(`Verification email sent to ${email}`, 'MailService');
        } catch (err) {
            this.logger.error('Failed to send verification email', err, 'MailService');
            throw new InternalServerErrorException('Failed to send verification email');
        }
    }

    async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
        try {
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: 'Reset Your Cykruit Password',
                html: passwordResetTemplate(resetUrl),
            });

            if (error) throw new Error(error.message);
            this.logger.log(`Password reset email sent to ${email}`, 'MailService');
        } catch (err) {
            this.logger.error('Failed to send password reset email', err, 'MailService');
            throw new InternalServerErrorException('Failed to send password reset email');
        }
    }

    async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
        try {
            const loginUrl = `${this.frontendUrl}/login`;
            const { error } = await this.resend.emails.send({
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: '✅ Password Successfully Changed',
                html: passwordChangedTemplate(firstName, loginUrl),
            });

            if (error) this.logger.error('Failed to send password changed email', error.message, 'MailService');
            else this.logger.log(`Password changed email sent to ${email}`, 'MailService');
        } catch (err) {
            // Don't throw — password is already changed
            this.logger.error('Failed to send password changed email', err, 'MailService');
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
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: '🔔 You have a new notification',
                html: notificationTemplate(message, actionUrl, firstName),
            });

            if (error) throw new Error(error.message);
            this.logger.log(`Notification email sent to ${email}`, 'MailService');
        } catch (err) {
            this.logger.error('Failed to send notification email', err, 'MailService');
            throw new InternalServerErrorException('Failed to send notification email');
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
                from: `"Cykruit 🚀" <${this.fromEmail}>`,
                replyTo: 'support@cykruit.com',
                to: email,
                subject: '⚠️ Your Cykruit Account is Scheduled for Deletion',
                html: accountDeletionScheduledTemplate(deletionScheduledAt, loginUrl),
            });

            if (error) {
                this.logger.error('Failed to send account deletion scheduled email', error.message, 'MailService');
            } else {
                this.logger.log(`Account deletion scheduled email sent to ${email}`, 'MailService');
            }
        } catch (err) {
            // Don't throw — deletion is already scheduled, this is best-effort
            this.logger.error('Failed to send account deletion scheduled email', err, 'MailService');
        }
    }
}