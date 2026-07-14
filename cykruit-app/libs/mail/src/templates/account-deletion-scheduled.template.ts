// libs/mail/src/templates/account-deletion-scheduled.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

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
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">Account deletion scheduled</h1>
      <p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Irreversible action pending</p>
    </div>

    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
      Your Cykruit account is scheduled for permanent deletion on <strong>${formattedDate}</strong>. All your data will be erased. This action cannot be undone once complete.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:#fff7ed;border-left:3px solid #f59e0b;padding:16px 18px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
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