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
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">Team join request</h1>
      <p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Action required</p>
    </div>

    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
      ${ownerFirstName ? `${ownerFirstName},` : 'A'} new user wants to join the ${companyName} team on Cykruit.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;border-bottom:1px solid #e2e8f0;">
                <span style="color:#64748b;">Name:</span> &nbsp; <strong style="color:#0f172a;">${requesterName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                <span style="color:#64748b;">Email:</span> &nbsp; <strong style="color:#1d4ed8;">${requesterEmail}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="left">
          ${cyberButton(dashboardUrl, "Review Request")}
        </td>
      </tr>
    </table>
    `,
    "Team join request",
  );