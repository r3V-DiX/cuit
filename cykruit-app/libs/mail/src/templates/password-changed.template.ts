/* Hallmark · component: email-password-changed · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const passwordChangedTemplate = (
  firstName: string,
  loginUrl: string,
): string =>
  baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.SUCCESS};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          SECURITY UPDATE
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Password Changed <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Successfully</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          ${firstName ? `Hi ${firstName}, your` : "Your"} Cykruit account password was successfully updated. You can now log in using your new credentials.
        </td>
      </tr>
      <tr>
        <td align="center">
          ${cyberButton("LOG IN TO CYKRUIT", loginUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;">
          <table border="0" cellspacing="0" cellpadding="0" width="100%">
            <tr>
              <td style="background-color:${COLORS.ERROR_LIGHT};border:1px solid ${COLORS.ERROR_BORDER};border-radius:8px;padding:14px 18px;text-align:center;">
                <p style="margin:0;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;color:${COLORS.ERROR_TEXT};line-height:20px;">
                  ⚠️ <strong>Didn't make this change?</strong> Please contact our security support team immediately at <a href="mailto:support@cykruit.com" style="color:${COLORS.ERROR_TEXT};font-weight:700;text-decoration:underline;">support@cykruit.com</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
  );
