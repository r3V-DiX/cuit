// libs/mail/src/templates/account-deletion-scheduled.template.ts
import { baseTemplate } from './base.template';
import { cyberButton } from './cyber-button.template';

export const accountDeletionScheduledTemplate = (
    deletionScheduledAt: Date,
    loginUrl: string,
): string => {
    const formattedDate = deletionScheduledAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return baseTemplate(`
    <h2 style="color:#1B3C8B;margin:0 0 15px 0;font-size:28px;font-weight:700;text-align:center;">Account Deletion Scheduled</h2>
    <p style="text-align:center;margin:0 0 25px 0;">
      We've received your request to delete your Cykruit account.
      Your account is scheduled for permanent deletion on <strong>${formattedDate}</strong>.
    </p>
    <div style="background:#fef9ef;border-radius:8px;padding:20px;margin:0 0 25px 0;border-left:4px solid #f59e0b;">
      <p style="color:#92400e;margin:0 0 10px 0;font-size:14px;font-weight:600;">⏳ Changed your mind?</p>
      <p style="color:#92400e;margin:0;font-size:14px;">
        You have 30 days to cancel this request. Simply log in to your account before <strong>${formattedDate}</strong>
        and your account will be automatically reactivated.
      </p>
    </div>
    ${cyberButton('Log In to Cancel Deletion', loginUrl)}
    <div style="background:#fef2f2;border-radius:8px;padding:15px;margin-top:25px;border-left:3px solid #ef4444;">
      <p style="color:#991b1b;margin:0;font-size:13px;">
        <strong>⚠️ Important:</strong> After ${formattedDate}, your account and all associated data will be
        permanently and irreversibly deleted. This action cannot be undone.
      </p>
    </div>
    <p style="text-align:center;color:#64748b;font-size:13px;margin-top:20px;">
      If you did not request this, please contact us immediately at
      <a href="mailto:support@cykruit.com" style="color:#1B3C8B;">support@cykruit.com</a>
    </p>
  `);
};