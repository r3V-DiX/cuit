// libs/mail/src/templates/password-changed.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const passwordChangedTemplate = (
  firstName: string,
  loginUrl: string,
): string =>
  baseTemplate(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">Password Changed</h2>
      <p style="margin:0;font-size:15px;color:#64748b;">Your password has been updated successfully</p>
    </div>

    <p style="margin:0 0 20px 0;color:#334155;">
      Hi <strong>${firstName}</strong>, your Cykruit account password was successfully changed.
    </p>

    ${cyberButton("Login to Your Account", loginUrl)}

    <div style="background:#fee2e2;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #ef4444;">
      <p style="margin:0;font-size:13px;color:#991b1b;">
        🚨 If you did not make this change, please <a href="mailto:support@cykruit.com" style="color:#991b1b;font-weight:600;">contact support immediately</a> as your account may be compromised.
      </p>
    </div>
  `);
