/* Hallmark · component: email-verification · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const verificationTemplate = (verifyUrl: string): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:${COLORS.ACCENT_LIGHT};border:1px solid ${COLORS.ACCENT_BORDER};border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;line-height:64px;display:inline-block;vertical-align:middle;">✉️</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Verify your email address</h1>
      <p style="margin:0;font-size:14px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_MONO};letter-spacing:1px;">ACCOUNT ACTIVATION REQUIRED</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:15px;line-height:1.75;text-align:center;">
      You're one step away from joining the <strong style="color:${COLORS.INK};">cybersecurity job platform</strong> built for the infosec community. Confirm your email to activate your account.
    </p>

    ${cyberButton("Verify My Email", verifyUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:${COLORS.ACCENT_LIGHT};border:1px solid ${COLORS.ACCENT_BORDER};border-left:3px solid ${COLORS.ACCENT};border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:${COLORS.BODY};font-family:${TYPOGRAPHY.FONT_MONO};letter-spacing:1px;">
            ⏰ LINK EXPIRES IN <strong style="color:${COLORS.INK};">24 HOURS</strong> &nbsp;|&nbsp; SINGLE USE ONLY
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:${COLORS.MUTED};text-align:center;line-height:1.6;">
      Didn't create an account? You can safely ignore this email — your address won't be used.
    </p>
    `,
    "Verify your Cykruit account — click to activate"
  );
