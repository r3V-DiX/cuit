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
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">⚠️</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">Account deletion scheduled</h1>
      <p style="margin:0;font-size:14px;color:#64748b;font-family:'Courier New',monospace;letter-spacing:1px;">IRREVERSIBLE ACTION PENDING</p>
    </div>

    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.75;text-align:center;">
      Your Cykruit account is scheduled for permanent deletion on <strong style="color:#1e293b;">${formattedDate}</strong>. All data will be wiped — this cannot be undone.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 18px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#b45309;font-family:'Courier New',monospace;letter-spacing:0.5px;">⏳ CHANGED YOUR MIND?</p>
          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
            Log in to your account before <strong>${formattedDate}</strong> and the deletion will be automatically cancelled.
          </p>
        </td>
      </tr>
    </table>

    ${cyberButton("Log In to Cancel Deletion", loginUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">
      Didn't request this? Contact <a href="mailto:support@cykruit.com" style="color:#3b82f6;text-decoration:none;">support@cykruit.com</a> immediately.
    </p>
    `,
    `Account deletion scheduled for ${formattedDate} — log in to cancel`
  );
};
