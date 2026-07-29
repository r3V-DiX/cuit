/* Hallmark · component: email-job-review · genre: modern-minimal */

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
    <div style="text-align:left;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_MONO};letter-spacing:0.5px;text-transform:${TYPOGRAPHY.META_UPPERCASE};">
        ${data.isResubmission ? "Job Re-review Required" : "New Job Pending Review"}
      </p>
      <h1 style="margin:0;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">
        ${data.isResubmission ? "Job Updated — Needs Re-review" : "A new job is waiting for review"}
      </h1>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      Hi ${data.adminFirstName}, a job listing ${data.isResubmission ? "was edited and requires your re-approval" : "has been submitted and is waiting for your review"}.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:${COLORS.CANVAS};border:1px solid ${COLORS.PAPER_BORDER};border-radius:8px;padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:4px 0;">
                <span style="font-size:12px;color:${COLORS.MUTED_LIGHTER};font-family:${TYPOGRAPHY.FONT_MONO};">JOB TITLE</span><br/>
                <span style="font-size:15px;font-weight:600;color:${COLORS.INK};">${data.jobTitle}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 4px;">
                <span style="font-size:12px;color:${COLORS.MUTED_LIGHTER};font-family:${TYPOGRAPHY.FONT_MONO};">COMPANY</span><br/>
                <span style="font-size:14px;color:${COLORS.BODY};">${data.companyName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="font-size:12px;color:${COLORS.MUTED_LIGHTER};font-family:${TYPOGRAPHY.FONT_MONO};">TYPE / MODE</span><br/>
                <span style="font-size:14px;color:${COLORS.BODY};">${data.jobType} · ${data.workMode}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${cyberButton("Review Job", data.reviewUrl)}

    <p style="margin:24px 0 0;font-size:${TYPOGRAPHY.SMALL_SIZE};color:${COLORS.MUTED_LIGHTER};line-height:${TYPOGRAPHY.SMALL_LINESPACING};">
      You're receiving this because you're an admin on Cykruit. Log in to the admin panel to approve or reject this listing.
    </p>
    `,
    `${data.isResubmission ? "Re-review required" : "New job pending"}: ${data.jobTitle} at ${data.companyName}`,
  );
