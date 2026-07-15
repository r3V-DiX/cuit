import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

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
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-family:monospace;letter-spacing:0.5px;text-transform:uppercase;">
        ${data.isResubmission ? "Job Re-review Required" : "New Job Pending Review"}
      </p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">
        ${data.isResubmission ? "Job Updated — Needs Re-review" : "A new job is waiting for review"}
      </h1>
    </div>

    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      Hi ${data.adminFirstName}, a job listing ${data.isResubmission ? "was edited and requires your re-approval" : "has been submitted and is waiting for your review"}.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:4px 0;">
                <span style="font-size:12px;color:#94a3b8;font-family:monospace;">JOB TITLE</span><br/>
                <span style="font-size:15px;font-weight:600;color:#0f172a;">${data.jobTitle}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 4px;">
                <span style="font-size:12px;color:#94a3b8;font-family:monospace;">COMPANY</span><br/>
                <span style="font-size:14px;color:#334155;">${data.companyName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="font-size:12px;color:#94a3b8;font-family:monospace;">TYPE / MODE</span><br/>
                <span style="font-size:14px;color:#334155;">${data.jobType} · ${data.workMode}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${cyberButton("Review Job", data.reviewUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
      You're receiving this because you're an admin on Cykruit. Log in to the admin panel to approve or reject this listing.
    </p>
    `,
    `${data.isResubmission ? "Re-review required" : "New job pending"}: ${data.jobTitle} at ${data.companyName}`,
  );
