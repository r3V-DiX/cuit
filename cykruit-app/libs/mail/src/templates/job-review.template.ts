// libs/mail/src/templates/job-review.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const jobReviewTemplate = (data: {
  adminFirstName: string;
  jobTitle: string;
  companyName: string;
  jobType: string;
  workMode: string;
  isResubmission: boolean;
  reviewUrl: string;
}): string =>
  baseTemplate(
    `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          ${data.isResubmission ? "JOB RE-REVIEW REQUIRED" : "NEW JOB PENDING APPROVAL"}
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Job Listing <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Moderation</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          Hi ${data.adminFirstName}, a job listing ${data.isResubmission ? "was recently edited and requires re-approval" : "was submitted for review"} before going live on the platform.
        </td>
      </tr>

      <!-- Job Summary Box -->
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
                      Job Title
                    </td>
                    <td
                      align="right"
                      style="padding:6px 0 6px 16px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; font-weight:700; color:${COLORS.INK}; border-bottom:1px solid #f1f5f9;"
                    >
                      ${data.jobTitle}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="padding:6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; color:${COLORS.MUTED}; border-bottom:1px solid #f1f5f9;"
                    >
                      Company
                    </td>
                    <td
                      align="right"
                      style="padding:6px 0 6px 16px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; font-weight:700; color:${COLORS.INK}; border-bottom:1px solid #f1f5f9;"
                    >
                      ${data.companyName}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="padding:6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; color:${COLORS.MUTED};"
                    >
                      Type / Mode
                    </td>
                    <td
                      align="right"
                      style="padding:6px 0 6px 16px; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; line-height:20px; font-weight:700; color:${COLORS.BRAND_PRIMARY};"
                    >
                      ${data.jobType} · ${data.workMode}
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
          ${cyberButton("REVIEW LISTING", data.reviewUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          Log in to the admin moderation panel to approve or reject this listing.
        </td>
      </tr>
    </table>
    `,
    `${data.isResubmission ? "Re-review required" : "New job pending"}: ${data.jobTitle} at ${data.companyName}`,
  );

