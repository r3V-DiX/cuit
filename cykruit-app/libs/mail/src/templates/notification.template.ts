/* Hallmark · component: email-notification · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const notificationTemplate = (
  message: string,
  actionUrl?: string,
  firstName?: string,
): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Notification</h1>
      ${firstName ? `<p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">FOR ${firstName}</p>` : ""}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:${COLORS.CANVAS};border:1px solid ${COLORS.PAPER_BORDER};border-radius:8px;padding:20px 24px;">
          <p style="margin:0;color:${COLORS.BODY};font-size:15px;line-height:1.6;">${message}</p>
        </td>
      </tr>
    </table>

    ${actionUrl ? cyberButton("View details", actionUrl) : ""}
    `,
    message.slice(0, 80)
  );
