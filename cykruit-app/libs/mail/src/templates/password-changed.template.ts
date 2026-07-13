// libs/mail/src/templates/password-changed.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const passwordChangedTemplate = (
  firstName: string,
  loginUrl: string,
): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">🔒</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">Password updated</h1>
      <p style="margin:0;font-size:14px;color:#64748b;font-family:'Courier New',monospace;letter-spacing:1px;">ACCOUNT SECURITY ALERT</p>
    </div>

    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.75;text-align:center;">
      Hey <strong style="color:#1e293b;">${firstName}</strong>, your Cykruit account password was successfully updated. You can log in with your new credentials right now.
    </p>

    ${cyberButton("Go to Dashboard", loginUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#7f1d1d;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            🚨 DIDN'T DO THIS? — Contact <a href="mailto:support@cykruit.com" style="color:#ef4444;text-decoration:none;">support@cykruit.com</a> immediately. Your account may be compromised.
          </p>
        </td>
      </tr>
    </table>
    `,
    "Your Cykruit password was successfully changed"
  );
