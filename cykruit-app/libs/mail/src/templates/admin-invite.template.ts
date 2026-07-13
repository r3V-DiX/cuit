// libs/mail/templates/admin-invite.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const adminInviteTemplate = (
  inviteeEmail: string,
  inviterName: string,
  inviteUrl: string,
  expiresInHours: number,
): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;"><span style="font-size:28px;display:inline-block;vertical-align:middle;">🛡️</span></div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">You've been invited to Cykruit Admin</h1>
      <p style="margin:0;font-size:14px;color:#64748b;font-family:'Courier New',monospace;letter-spacing:1px;">ADMIN CONSOLE ACCESS</p>
    </div>

    <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.75;text-align:center;">
      Hey <strong style="color:#1e293b;">${inviteeEmail}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.75;text-align:center;">
      <strong style="color:#1e293b;">${inviterName}</strong> has invited you to join the Cykruit admin console. Set your password to activate your account.
    </p>

    ${cyberButton("Accept Invite", inviteUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#374151;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            ⏰ INVITE EXPIRES IN <strong style="color:#1e293b;">${expiresInHours} HOURS</strong> &nbsp;|&nbsp; NOT EXPECTED? IGNORE THIS EMAIL.
          </p>
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join the Cykruit admin console`
  );
