// libs/mail/src/templates/password-reset.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const passwordResetTemplate = (resetUrl: string): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">🔐</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">Password reset request</h1>
      <p style="margin:0;font-size:14px;color:#64748b;font-family:'Courier New',monospace;letter-spacing:1px;">SECURE CREDENTIAL UPDATE</p>
    </div>

    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.75;text-align:center;">
      We received a request to reset the password for your Cykruit account. Click below to create a new password — this link is valid for <strong style="color:#1e293b;">1 hour</strong>.
    </p>

    ${cyberButton("Reset My Password", resetUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#78350f;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            ⚠️ NOT YOU? — Ignore this email. Your password remains unchanged.
          </p>
        </td>
      </tr>
    </table>
    `,
    "Password reset link inside — expires in 1 hour"
  );
