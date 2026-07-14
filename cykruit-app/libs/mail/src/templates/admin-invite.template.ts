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
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">Admin invite</h1>
      <p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Admin console access</p>
    </div>

    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
      ${inviterName} invited you to join the Cykruit admin console. Set your password to activate your account.
    </p>

    ${cyberButton("Accept invite", inviteUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:#eff6ff;border-left:3px solid #1d4ed8;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#1e3a8a;line-height:1.5;">
            This invite expires in ${expiresInHours} hours. If you are not expecting this, ignore this email.
          </p>
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join the Cykruit admin console`
  );