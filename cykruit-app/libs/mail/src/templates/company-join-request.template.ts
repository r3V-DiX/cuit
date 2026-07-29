/* Hallmark · component: email-company-join-request · genre: modern-minimal */

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
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Team join request</h1>
      <p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">Action required</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      ${ownerFirstName ? `${ownerFirstName},` : 'A'} new user wants to join the ${companyName} team on Cykruit.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:${COLORS.CANVAS};border:1px solid ${COLORS.PAPER_BORDER};border-radius:8px;padding:18px 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;font-family:${TYPOGRAPHY.FONT_FAMILY};border-bottom:1px solid ${COLORS.PAPER_BORDER};">
                <span style="color:${COLORS.MUTED};">Name:</span> &nbsp; <strong style="color:${COLORS.INK};">${requesterName}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;font-family:${TYPOGRAPHY.FONT_FAMILY};">
                <span style="color:${COLORS.MUTED};">Email:</span> &nbsp; <strong style="color:${COLORS.ACCENT};">${requesterEmail}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="left">
          ${cyberButton("Review Request", dashboardUrl)}
        </td>
      </tr>
    </table>
    `,
    "Team join request",
  );
