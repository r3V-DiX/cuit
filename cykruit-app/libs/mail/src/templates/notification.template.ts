// libs/mail/src/templates/notification.template.ts
import { baseTemplate } from './base.template';
import { cyberButton } from './cyber-button.template';

export const notificationTemplate = (
    message: string,
    actionUrl?: string,
    firstName?: string,
): string =>
    baseTemplate(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;margin-bottom:16px;">🔔</div>
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">New Notification</h2>
      ${firstName ? `<p style="margin:0;font-size:15px;color:#64748b;">Hi ${firstName}</p>` : ''}
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:0 0 24px 0;border:1px solid #e2e8f0;">
      <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${message}</p>
    </div>

    ${actionUrl ? cyberButton('View Details', actionUrl) : ''}
  `);