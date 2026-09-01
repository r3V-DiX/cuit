// libs/mail/src/templates/notification.template.ts
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
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          SYSTEM NOTIFICATION
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Update on Your <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Account</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          ${firstName ? `Hi ${firstName},` : "Hello,"} here is the latest update regarding your activity on Cykruit.
        </td>
      </tr>

      <!-- Message card -->
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto; width: 100%; max-width: 480px; background-color: #ffffff; border: 1px solid ${COLORS.PAPER_BORDER}; border-radius: 10px; padding: 22px;">
            <tr>
              <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:15px; color:${COLORS.BODY}; line-height:24px;">
                ${message}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${actionUrl ? `
      <tr>
        <td align="center">
          ${cyberButton("VIEW DETAILS", actionUrl)}
        </td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          You can adjust your notification preferences at any time from your account settings.
        </td>
      </tr>
    </table>
    `,
    message.slice(0, 80)
  );

