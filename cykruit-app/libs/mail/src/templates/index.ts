// libs/mail/templates/index.ts
import { baseTemplate } from './base.template';
import { cyberButton } from './cyber-button.template';

export const verificationTemplate = (verifyUrl: string): string =>
    baseTemplate(`
    <h2 style="color:#1B3C8B;margin:0 0 15px 0;font-size:28px;font-weight:700;text-align:center;">Welcome to Cykruit!</h2>
    <p style="text-align:center;margin:0 0 25px 0;">Thanks for signing up! Click below to verify your email and activate your account.</p>
    ${cyberButton('Verify Email Address', verifyUrl)}
    <div style="background:#fef2f2;border-radius:8px;padding:15px;margin-top:25px;border-left:3px solid #ef4444;">
      <p style="color:#991b1b;margin:0;font-size:13px;">
        <strong>⚠️ Security Notice:</strong> This link expires in 24 hours. If you didn't create this account, ignore this email.
      </p>
    </div>
  `);

export const passwordResetTemplate = (resetUrl: string): string =>
    baseTemplate(`
    <h2 style="color:#1B3C8B;margin:0 0 15px 0;font-size:28px;font-weight:700;text-align:center;">Reset Your Password</h2>
    <p style="text-align:center;margin:0 0 25px 0;">We received a request to reset your password. Click below to create a new one.</p>
    ${cyberButton('Reset Password', resetUrl)}
    <div style="background:#fef2f2;border-radius:8px;padding:15px;margin-top:25px;border-left:3px solid #ef4444;">
      <p style="color:#991b1b;margin:0;font-size:13px;">
        <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request this, ignore this email.
      </p>
    </div>
  `);

export const passwordChangedTemplate = (firstName: string, loginUrl: string): string =>
    baseTemplate(`
    <h2 style="color:#1B3C8B;margin:0 0 15px 0;font-size:28px;font-weight:700;text-align:center;">Password Successfully Changed</h2>
    <p style="text-align:center;margin:0 0 25px 0;">Hi ${firstName}, your password has been successfully changed. You can now log in.</p>
    ${cyberButton('Go to Login', loginUrl)}
    <div style="background:#fef2f2;border-radius:8px;padding:15px;margin-top:25px;border-left:3px solid #ef4444;">
      <p style="color:#991b1b;margin:0;font-size:13px;">
        <strong>⚠️ Security Alert:</strong> If you didn't make this change, contact support@cykruit.com immediately.
      </p>
    </div>
  `);

export const notificationTemplate = (
    message: string,
    actionUrl?: string,
    firstName?: string,
): string =>
    baseTemplate(`
    <p style="font-size:16px;color:#334155;margin:0 0 20px 0;">${firstName ? `Hi ${firstName},` : 'Hi there,'}</p>
    <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-left:4px solid #1B3C8B;padding:20px;border-radius:8px;margin:25px 0;">
      <p style="font-size:15px;color:#334155;margin:0;">${message}</p>
    </div>
    ${actionUrl ? cyberButton('View Notification', actionUrl) : ''}
    <p style="font-size:13px;color:#64748b;margin:20px 0 0 0;">Manage notification preferences in your account settings.</p>
  `);