// libs/mail/src/templates/password-reset.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const passwordResetTemplate = (resetUrl: string): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:24px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">Reset password</h1>
      <p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Account recovery</p>
    </div>

    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
      We received a request to reset your password. Use the button below to create a new one. This link expires in 1 hour.
    </p>

    ${cyberButton("Reset password", resetUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:#fff7ed;border-left:3px solid #f59e0b;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            If you did not request this, ignore this email. Your password will remain unchanged.
          </p>
        </td>
      </tr>
    </table>
    `,
    "Reset your Cykruit password"
  );