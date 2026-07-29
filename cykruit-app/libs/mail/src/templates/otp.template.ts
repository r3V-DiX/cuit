/* Hallmark · component: email-otp · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const otpTemplate = (
  firstName: string,
  otp: string,
  expiresInMinutes: number,
  purpose: string,
): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Verification code</h1>
      <p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">${purpose}</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      ${firstName ? `${firstName}, use` : 'Use'} this code to verify your request. It expires in ${expiresInMinutes} minutes.
    </p>

    <!-- OTP block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;width:100%;">
      <tr>
        <td align="center" style="background:${COLORS.ACCENT_LIGHT};border:1px solid ${COLORS.ACCENT_BORDER};border-radius:8px;padding:24px;">
          <p style="margin:0;font-size:36px;font-weight:600;color:${COLORS.ACCENT};letter-spacing:8px;text-align:center;">${otp}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background:${COLORS.WARNING_LIGHT};border-left:3px solid ${COLORS.WARNING_BORDER};padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:${COLORS.WARNING_TEXT};line-height:1.5;">
            Do not share this code. Cykruit will never ask for it outside of the login process.
          </p>
        </td>
      </tr>
    </table>
    `,
    `Your verification code is ${otp}`
  );
