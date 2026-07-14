// libs/mail/src/templates/notification.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const notificationTemplate = (
  message: string,
  actionUrl?: string,
  firstName?: string,
): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">Notification</h1>
      ${firstName ? `<p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">FOR ${firstName}</p>` : ""}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;">
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">${message}</p>
        </td>
      </tr>
    </table>

    ${actionUrl ? cyberButton("View details", actionUrl) : ""}
    `,
    message.slice(0, 80)
  );