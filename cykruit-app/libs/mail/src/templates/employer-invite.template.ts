/* Hallmark · component: email-employer-invite · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { COLORS, TYPOGRAPHY, SPACING } from "./colors";

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
    <!-- Company header -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:${COLORS.ACCENT_LIGHT};border:1px solid ${COLORS.ACCENT_BORDER};border-radius:12px;padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:middle;">
                ${
                  companyLogo
                    ? `<img src="${companyLogo}" alt="${companyName}" style="height:44px;border-radius:8px;display:block;" />`
                    : `<div style="display:inline-block;width:44px;height:44px;border-radius:10px;background:${COLORS.ACCENT};text-align:center;line-height:44px;font-size:20px;font-weight:700;color:#ffffff;font-family:${TYPOGRAPHY.FONT_FAMILY};">${companyName.charAt(0).toUpperCase()}</div>`
                }
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;">
                <p style="margin:0;font-size:18px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">${companyName}</p>
                <p style="margin:4px 0 0;font-size:12px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:0.3px;">has invited you to join their hiring team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Greeting -->
    <p style="margin:0 0 8px;font-size:20px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">
      You're invited, ${inviteeName.split(" ")[0]}!
    </p>
    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      <strong style="color:${COLORS.INK};">${inviterName}</strong> invited you to join <strong style="color:${COLORS.INK};">${companyName}</strong> on Cykruit as a <strong style="color:${COLORS.ACCENT};">${assignedRole}</strong>.
    </p>

    <!-- Role info card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
      <tr>
        <td style="background:${COLORS.CANVAS};border:1px solid ${COLORS.PAPER_BORDER};border-radius:10px;padding:16px 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="50%" style="padding:4px 0;font-size:13px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};">
                <span style="color:${COLORS.MUTED};">Role assigned</span>
              </td>
              <td width="50%" style="padding:4px 0;font-size:13px;font-weight:600;color:${COLORS.ACCENT};font-family:${TYPOGRAPHY.FONT_FAMILY};text-align:right;">
                ${assignedRole}
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};border-top:1px solid ${COLORS.PAPER_BORDER};">
                <span>Invited by</span>
              </td>
              <td style="padding:4px 0;font-size:13px;font-weight:600;color:${COLORS.INK};font-family:${TYPOGRAPHY.FONT_FAMILY};text-align:right;border-top:1px solid ${COLORS.PAPER_BORDER};">
                ${inviterName}
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};border-top:1px solid ${COLORS.PAPER_BORDER};">
                <span>Expires in</span>
              </td>
              <td style="padding:4px 0;font-size:13px;font-weight:600;color:${COLORS.INK};font-family:${TYPOGRAPHY.FONT_FAMILY};text-align:right;border-top:1px solid ${COLORS.PAPER_BORDER};">
                ${expiresInHours} hours
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Full-width CTA button -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      <tr>
        <td style="border-radius:12px;background-color:${COLORS.ACCENT};">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${inviteUrl}" style="height:60px;v-text-anchor:middle;width:100%;" arcsize="7%" stroke="f" fillcolor="${COLORS.ACCENT}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:18px;font-weight:700;letter-spacing:0.3px;">
              Accept Invitation →
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${inviteUrl}"
             style="display:block;padding:22px 32px;font-size:18px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${TYPOGRAPHY.FONT_FAMILY};border-radius:12px;text-align:center;letter-spacing:0.3px;">
            Accept Invitation &rarr;
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
    `,
    `${inviterName} invited you to join ${companyName} on Cykruit`,
  );
