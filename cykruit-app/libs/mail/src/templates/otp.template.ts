// libs/mail/src/templates/otp.template.ts
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
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          ${purpose ? purpose : "SECURITY VERIFICATION"}
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Your One-Time <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Passcode</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          ${firstName ? `Hi ${firstName}, use` : "Use"} the verification code below to authorize your session. This code will expire in ${expiresInMinutes} minutes.
        </td>
      </tr>

      <!-- Large OTP Box -->
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto; width: 100%; max-width: 320px;">
            <tr>
              <td align="center" style="background-color:#ffffff;border:1px solid #DBDFE4;border-radius:10px;padding:22px 16px;box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
                <span style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:36px;font-weight:800;color:${COLORS.BRAND_PRIMARY};letter-spacing:10px;display:block;">
                  ${otp}
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Warning note -->
      <tr>
        <td style="background-color:${COLORS.WARNING_LIGHT};border:1px solid ${COLORS.WARNING_BORDER};border-radius:8px;padding:14px 18px;text-align:center;">
          <p style="margin:0;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;color:${COLORS.WARNING_TEXT};line-height:20px;">
            🔒 <strong>Security Warning:</strong> Never share this code with anyone. Cykruit staff will never ask for your verification code.
          </p>
        </td>
      </tr>
    </table>
    `,
    `Your verification code is ${otp}`
  );

