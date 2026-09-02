// libs/mail/src/templates/company-join-request.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const companyJoinRequestTemplate = (
  ownerFirstName: string,
  requesterName: string,
  requesterEmail: string,
  companyName: string,
  dashboardUrl: string,
): string =>
  baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          TEAM JOIN REQUEST
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          New Team Member <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Request</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          ${ownerFirstName ? `Hi ${ownerFirstName}, a` : "A"} team member has requested access to join <strong>${companyName}</strong> on Cykruit.
        </td>
      </tr>

      <!-- Requester card -->
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table
            role="presentation"
            border="0"
            cellspacing="0"
            cellpadding="0"
            width="100%"
            style="width:100%; max-width:440px; background-color:#ffffff; border:1px solid ${COLORS.PAPER_BORDER}; border-radius:10px;"
          >
            <tr>
              <td style="padding:20px;">
                <table
                  role="presentation"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  width="100%"
                  style="width:100%;"
                >
                  <tr>
                    <td
                      style="padding:6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; color:${COLORS.MUTED}; border-bottom:1px solid #f1f5f9;"
                    >
                      Applicant Name
                    </td>
                    <td
                      align="right"
                      style="padding:6px 0 6px 16px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; font-weight:700; color:${COLORS.INK}; border-bottom:1px solid #f1f5f9;"
                    >
                      ${requesterName}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="padding:6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; color:${COLORS.MUTED}; border-bottom:1px solid #f1f5f9;"
                    >
                      Work Email
                    </td>
                    <td
                      align="right"
                      style="padding:6px 0 6px 16px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; font-weight:700; color:${COLORS.BRAND_PRIMARY}; border-bottom:1px solid #f1f5f9; word-break:break-word;"
                    >
                      ${requesterEmail}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="padding:6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; color:${COLORS.MUTED};"
                    >
                      Organization
                    </td>
                    <td
                      align="right"
                      style="padding:6px 0 6px 16px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; font-weight:700; color:${COLORS.INK};"
                    >
                      ${companyName}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center">
          ${cyberButton("REVIEW IN DASHBOARD", dashboardUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          You can approve or decline this request from your employer dashboard settings.
        </td>
      </tr>
    </table>
    `,
    `${requesterName} wants to join your team on Cykruit`,
  );

