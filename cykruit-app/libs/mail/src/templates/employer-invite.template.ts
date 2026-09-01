// libs/mail/src/templates/employer-invite.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

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
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          TEAM INVITATION
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Join ${companyName} on <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Cykruit</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          Hi ${inviteeName.split(" ")[0]}, <strong>${inviterName}</strong> has invited you to collaborate on the <strong>${companyName}</strong> hiring team as a <strong>${assignedRole}</strong>.
        </td>
      </tr>

      <!-- Role Details Box -->
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto; width: 100%; max-width: 440px; background-color: #ffffff; border: 1px solid ${COLORS.PAPER_BORDER}; border-radius: 10px; padding: 20px;">
            <tr>
              <td>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED}; border-bottom: 1px solid #f1f5f9;">Company</td>
                    <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.INK}; border-bottom: 1px solid #f1f5f9;">${companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED}; border-bottom: 1px solid #f1f5f9;">Assigned Role</td>
                    <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.BRAND_PRIMARY}; border-bottom: 1px solid #f1f5f9;">${assignedRole}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED}; border-bottom: 1px solid #f1f5f9;">Invited By</td>
                    <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.INK}; border-bottom: 1px solid #f1f5f9;">${inviterName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED};">Expires In</td>
                    <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.INK};">${expiresInHours} hours</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center">
          ${cyberButton("ACCEPT INVITATION", inviteUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          If you weren't expecting this invitation, you can safely ignore this email.
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join ${companyName} on Cykruit`,
  );

