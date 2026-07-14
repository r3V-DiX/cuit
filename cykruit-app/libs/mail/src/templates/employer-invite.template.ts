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
    <div style="text-align:left;margin-bottom:24px;">
      ${
        companyLogo
          ? `<img src="${companyLogo}" alt="${companyName}" style="max-height:48px;border-radius:8px;margin-bottom:16px;" />`
          : ""
      }
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">You are invited</h1>
      <p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Team access granted</p>
    </div>

    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
      ${inviterName} invited you to join the ${companyName} hiring team on Cykruit as a ${assignedRole}.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;border-bottom:1px solid #e2e8f0;">
                <span style="color:#64748b;">Company:</span> &nbsp; <strong style="color:#0f172a;">${companyName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                <span style="color:#64748b;">Role:</span> &nbsp; <strong style="color:#1d4ed8;">${assignedRole}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="left">
          ${cyberButton(inviteUrl, "Accept Invitation")}
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      This invitation link will expire in ${expiresInHours} hours.
    </p>
    `,
    "You're invited to join the team",
  );