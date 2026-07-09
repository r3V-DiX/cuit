// libs/mail/src/templates/employer-invite.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const employerInviteTemplate = (
  inviteeName: string,
  inviterName: string,
  companyName: string,
  companyLogo: string | null,
  assignedRole: "Hiring Manager" | "Recruiter",
  inviteUrl: string,
  expiresInHours: number,
): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      ${
        companyLogo
          ? `<img src="${companyLogo}" alt="${companyName}" style="max-height:56px;border-radius:10px;margin-bottom:20px;" />`
          : `<div style="display:inline-block;width:64px;height:64px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.3);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;"><span style="font-size:28px;display:inline-block;vertical-align:middle;">💼</span></div>`
      }
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">You've been invited</h1>
      <p style="margin:0;font-size:14px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:1px;">TEAM ACCESS GRANTED</p>
    </div>

    <p style="margin:0 0 16px;color:#9ca3af;font-size:15px;line-height:1.75;text-align:center;">
      Hey <strong style="color:#f1f5f9;">${inviteeName}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.75;text-align:center;">
      <strong style="color:#f1f5f9;">${inviterName}</strong> has invited you to join the <strong style="color:#f1f5f9;">${companyName}</strong> hiring team on Cykruit as a <strong style="color:#3b82f6;">${assignedRole}</strong>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#0b1120;border:1px solid #1f2937;border-radius:10px;padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:0.5px;border-bottom:1px solid #1f2937;">
                <span style="color:#6b7280;">COMPANY</span>&nbsp;&nbsp;<strong style="color:#cbd5e1;">${companyName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:0.5px;">
                <span style="color:#6b7280;">ROLE</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong style="color:#3b82f6;">${assignedRole.toUpperCase()}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${cyberButton("Accept Invite", inviteUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            ⏰ INVITE EXPIRES IN <strong style="color:#9ca3af;">${expiresInHours} HOURS</strong> &nbsp;|&nbsp; NOT EXPECTED? IGNORE THIS EMAIL.
          </p>
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join ${companyName} on Cykruit`
  );
