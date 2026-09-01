// libs/mail/src/templates/broadcast.template.ts
import { baseTemplate } from "./base.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const broadcastTemplate = (
  subject: string,
  contentHtml: string,
  preheader?: string,
): string => {
  return baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          COMMUNITY ANNOUNCEMENT
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:30px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:40px;padding-bottom:24px;">
          ${subject}
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:15px;line-height:26px;color:${COLORS.BODY};" class="cykruit-broadcast-content">
          ${contentHtml}
        </td>
      </tr>
    </table>
    `,
    preheader || subject,
  );
};

