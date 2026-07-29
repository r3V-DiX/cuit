/* Hallmark · component: email-password-reset · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const passwordResetTemplate = (resetUrl: string): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Reset password</h1>
      <p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">Account recovery</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      We received a request to reset your password. Use the button below to create a new one. This link expires in 1 hour.
    </p>

    ${cyberButton("Reset password", resetUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:${COLORS.WARNING_LIGHT};border-left:3px solid ${COLORS.WARNING_BORDER};padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:${COLORS.WARNING_TEXT};line-height:1.5;">
            If you did not request this, ignore this email. Your password will remain unchanged.
          </p>
        </td>
      </tr>
    </table>
    `,
    "Reset your Cykruit password"
  );
