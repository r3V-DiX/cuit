/* Hallmark · component: email-employer-invite · genre: modern-minimal */

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
    <div style="text-align:left;margin-bottom:24px;">
      ${
        companyLogo
          ? `<img src="${companyLogo}" alt="${companyName}" style="max-height:48px;border-radius:8px;margin-bottom:16px;display:block;" />`
          : ""
      }
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">You are invited</h1>
      <p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">Team access granted</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      ${inviterName} invited you to join the ${companyName} hiring team on Cykruit as a ${assignedRole}.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:${COLORS.CANVAS};border:1px solid ${COLORS.PAPER_BORDER};border-radius:8px;padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};border-bottom:1px solid ${COLORS.PAPER_BORDER};">
                <span style="color:${COLORS.MUTED};">Company:</span> &nbsp; <strong style="color:${COLORS.INK};">${companyName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};">
                <span style="color:${COLORS.MUTED};">Role:</span> &nbsp; <strong style="color:${COLORS.ACCENT};">${assignedRole}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="left">
          ${cyberButton("Accept Invitation", inviteUrl)}
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:${TYPOGRAPHY.SMALL_SIZE};color:${COLORS.MUTED_LIGHTER};font-family:${TYPOGRAPHY.FONT_FAMILY};">
      This invitation link will expire in ${expiresInHours} hours.
    </p>
    `,
    "You're invited to join the team",
  );
