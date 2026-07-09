// libs/mail/src/templates/company-join-request.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const companyJoinRequestTemplate = (
  ownerFirstName: string,
  requesterName: string,
  requesterEmail: string,
  companyName: string,
  dashboardUrl: string,
): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">🤝</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">Team join request</h1>
      <p style="margin:0;font-size:14px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:1px;">ACTION REQUIRED</p>
    </div>

    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.75;text-align:center;">
      Hey <strong style="color:#f1f5f9;">${ownerFirstName}</strong>, someone from your company domain wants to join the <strong style="color:#f1f5f9;">${companyName}</strong> team on Cykruit.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#0b1120;border:1px solid #1f2937;border-radius:10px;padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;font-family:'Courier New',monospace;letter-spacing:0.5px;border-bottom:1px solid #1f2937;">
                <span style="color:#6b7280;">NAME</span>&nbsp;&nbsp;&nbsp;&nbsp;<strong style="color:#cbd5e1;">${requesterName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;font-family:'Courier New',monospace;letter-spacing:0.5px;">
                <span style="color:#6b7280;">EMAIL</span>&nbsp;&nbsp;&nbsp;<strong style="color:#3b82f6;">${requesterEmail}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;line-height:1.75;text-align:center;">
      Review their request in your employer dashboard to approve or decline access.
    </p>

    ${cyberButton("Review in Dashboard", dashboardUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            🔒 APPROVAL REQUIRES LOGIN — cannot be actioned without dashboard authentication.
          </p>
        </td>
      </tr>
    </table>
    `,
    `${requesterName} wants to join ${companyName} on Cykruit`
  );
