// libs/mail/src/templates/company-join-request.template.ts
import { baseTemplate } from "./base.template";

export const companyJoinRequestTemplate = (
  ownerFirstName: string,
  requesterName: string,
  requesterEmail: string,
  companyName: string,
  dashboardUrl: string,
): string =>
  baseTemplate(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;margin-bottom:16px;">🙋‍♂️</div>
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">Join Request</h2>
      <p style="margin:0;font-size:15px;color:#64748b;">Someone wants to join your company team on Cykruit</p>
    </div>

    <p style="margin:0 0 20px 0;color:#334155;font-size:15px;">
      Hello ${ownerFirstName},
    </p>
    <p style="margin:0 0 20px 0;color:#334155;line-height:1.6;">
      A request has been received from <strong>${requesterName}</strong> (${requesterEmail}) to join your company account for <strong>${companyName}</strong> on Cykruit because their email domain matches yours.
    </p>
    <p style="margin:0 0 30px 0;color:#334155;line-height:1.6;">
      Please review their request in your employer dashboard to approve or decline access.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="padding:10px;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#10b981;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(16,185,129,0.2);">
              Approve Request
            </a>
          </td>
          <td style="padding:10px;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#ef4444;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(239,68,68,0.2);">
              Decline Request
            </a>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3C8B;">
      <p style="margin:0;font-size:13px;color:#475569;">
        ℹ️ <strong>Security note:</strong> For security reasons, approval or rejection can only be performed after logging in to your verified employer dashboard.
      </p>
    </div>

    <p style="margin:20px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      If the buttons do not work, copy and paste this link into your browser to go to your dashboard:<br/>
      <a href="${dashboardUrl}" style="color:#1B3C8B;word-break:break-all;">${dashboardUrl}</a>
    </p>
  `);
