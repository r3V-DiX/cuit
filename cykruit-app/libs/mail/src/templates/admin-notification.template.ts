// libs/mail/src/templates/admin-notification.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const adminNotificationTemplate = (
  title: string,
  message: string,
  actionUrl?: string,
  firstName?: string,
): string =>
  baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          ADMIN NOTIFICATION
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          ${title}
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          ${firstName ? `Hi ${firstName},` : "Hello,"} an action was taken on the Cykruit admin console that needs your attention.
        </td>
      </tr>

      <!-- Message Card -->
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table
            role="presentation"
            border="0"
            cellspacing="0"
            cellpadding="0"
            width="100%"
            style="width:100%; max-width:480px; background-color:#ffffff; border:1px solid ${COLORS.PAPER_BORDER}; border-radius:10px;"
          >
            <tr>
              <td
                style="padding:22px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:15px; line-height:24px; color:${COLORS.BODY};"
              >
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
    </table>
    `,
    message.slice(0, 80)
  );
