// libs/mail/src/templates/verification.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const verificationTemplate = (verifyUrl: string): string =>
  baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          ACCOUNT VERIFICATION
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Confirm Your Email to Secure Your <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Account</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          Thanks for signing up with Cykruit! To complete your registration and activate your access to the cybersecurity ecosystem, please click the button below.
        </td>
      </tr>
      <tr>
        <td align="center">
          ${cyberButton("VERIFY &amp; CONTINUE", verifyUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          Didn’t sign up for this? No worries — simply ignore this message.<br/>
          <span style="font-size:12px;color:${COLORS.MUTED_LIGHTER};">Link expires in 24 hours.</span>
        </td>
      </tr>
    </table>
    `,
    "Confirm your email address to secure your Cykruit account"
  );

