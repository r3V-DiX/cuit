// libs/mail/src/templates/account-deletion-scheduled.template.ts
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
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.ERROR};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
          DELETION SCHEDULED
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
          Account Deletion <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.ERROR};font-style:italic;">Pending</span>
        </td>
      </tr>
      <tr>
        <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
          Your Cykruit account is scheduled to be permanently deleted on <strong>${formattedDate}</strong>. All profiles, application history, and associated records will be erased.
        </td>
      </tr>

      <!-- Warning callout -->
      <tr>
        <td style="padding-bottom:28px;">
          <table border="0" cellspacing="0" cellpadding="0" width="100%">
            <tr>
              <td style="background-color:${COLORS.WARNING_LIGHT};border:1px solid ${COLORS.WARNING_BORDER};border-radius:8px;padding:16px 20px;text-align:center;">
                <p style="margin:0;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;color:${COLORS.WARNING_TEXT};line-height:22px;">
                  💡 <strong>Changed your mind?</strong> You can automatically cancel this deletion at any point before <strong>${formattedDate}</strong> by logging into your account.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <tr>
        <td align="center">
          ${cyberButton("LOG IN TO CANCEL DELETION", loginUrl)}
        </td>
      </tr>
      <tr>
        <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
          If you intended to delete your account, no further action is required.
        </td>
      </tr>
    </table>
    `,
    `Account deletion scheduled for ${formattedDate}`
  );
};

