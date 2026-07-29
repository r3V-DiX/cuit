/* Hallmark · component: email-admin-invite · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const adminInviteTemplate = (
  inviteeEmail: string,
  inviterName: string,
  inviteUrl: string,
  expiresInHours: number,
): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Admin invite</h1>
      <p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">Admin console access</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      ${inviterName} invited you to join the Cykruit admin console. Set your password to activate your account.
    </p>

    ${cyberButton("Accept invite", inviteUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:${COLORS.ACCENT_LIGHT};border-left:3px solid ${COLORS.ACCENT};padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:${COLORS.INK};line-height:1.5;">
            This invite expires in ${expiresInHours} hours. If you are not expecting this, ignore this email.
          </p>
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join the Cykruit admin console`
  );
