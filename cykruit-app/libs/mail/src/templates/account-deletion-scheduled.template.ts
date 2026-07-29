/* Hallmark · component: email-deletion-scheduled · genre: modern-minimal */

import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";
import { COLORS, TYPOGRAPHY } from "./colors";

export const accountDeletionScheduledTemplate = (
  deletionScheduledAt: Date,
  loginUrl: string,
): string => {
  const formattedDate = deletionScheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return baseTemplate(
    `
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:${TYPOGRAPHY.HEADING_WEIGHT};color:${COLORS.INK};letter-spacing:${TYPOGRAPHY.HEADING_LETTERSPACING};">Account deletion scheduled</h1>
      <p style="margin:0;font-size:${TYPOGRAPHY.META_SIZE};color:${COLORS.MUTED};font-family:${TYPOGRAPHY.FONT_FAMILY};letter-spacing:${TYPOGRAPHY.META_LETTERSPACING};text-transform:${TYPOGRAPHY.META_UPPERCASE};">Irreversible action pending</p>
    </div>

    <p style="margin:0 0 24px;color:${COLORS.BODY};font-size:${TYPOGRAPHY.BODY_SIZE};line-height:${TYPOGRAPHY.BODY_LINEHEIGHT};">
      Your Cykruit account is scheduled for permanent deletion on <strong>${formattedDate}</strong>. All your data will be erased. This action cannot be undone once complete.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:${COLORS.WARNING_LIGHT};border-left:3px solid ${COLORS.WARNING_BORDER};padding:16px 18px;">
          <p style="margin:0;font-size:13px;color:${COLORS.WARNING_TEXT};line-height:1.6;">
            If you changed your mind, simply log in to your account before <strong>${formattedDate}</strong> to cancel the deletion automatically.
          </p>
        </td>
      </tr>
    </table>

    ${cyberButton("Log in to cancel", loginUrl)}
    `,
    `Account deletion scheduled for ${formattedDate}`
  );
};
