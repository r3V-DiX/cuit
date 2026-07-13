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
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">🔔</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">New notification</h1>
      ${firstName ? `<p style="margin:0;font-size:14px;color:#64748b;font-family:'Courier New',monospace;letter-spacing:1px;">FOR ${firstName.toUpperCase()}</p>` : ""}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;">
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.75;">${message}</p>
        </td>
      </tr>
    </table>

    ${actionUrl ? cyberButton("View Details", actionUrl) : ""}
    `,
    message.slice(0, 80)
  );
