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
      <div style="display:inline-block;width:64px;height:64px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.3);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">🔔</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">New notification</h1>
      ${firstName ? `<p style="margin:0;font-size:14px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:1px;">FOR ${firstName.toUpperCase()}</p>` : ""}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#0b1120;border:1px solid #1f2937;border-radius:10px;padding:20px 24px;">
          <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.75;">${message}</p>
        </td>
      </tr>
    </table>

    ${actionUrl ? cyberButton("View Details", actionUrl) : ""}
    `,
    message.slice(0, 80)
  );
