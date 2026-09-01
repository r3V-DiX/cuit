// libs/mail/src/templates/admin-invite.template.ts
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
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          ADMIN CONSOLE INVITATION
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Join the Admin <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Console</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          <strong>${inviterName}</strong> has invited your account (<span style="color:${COLORS.INK};font-weight:600;">${inviteeEmail}</span>) to join the Cykruit administrative operations portal.
        </td>
      </tr>
      <tr>
        <td align="center">
          ${cyberButton("ACCEPT &amp; SET PASSWORD", inviteUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          This administrative invitation will expire in <strong>${expiresInHours} hours</strong>.<br/>
          If you are not expecting this authorization, please notify security.
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join the Cykruit admin console`
  );

