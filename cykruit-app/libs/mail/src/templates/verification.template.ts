// libs/mail/src/templates/verification.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const verificationTemplate = (verifyUrl: string): string =>
  baseTemplate(
    `
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.3);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;line-height:64px;display:inline-block;vertical-align:middle;">✉️</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">Verify your email address</h1>
      <p style="margin:0;font-size:14px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:1px;">ACCOUNT ACTIVATION REQUIRED</p>
    </div>

    <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.75;text-align:center;">
      You're one step away from joining the <strong style="color:#f1f5f9;">cybersecurity job platform</strong> built for the infosec community. Confirm your email to activate your account.
    </p>

    ${cyberButton("Verify My Email", verifyUrl)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0 0;">
      <tr>
        <td style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:1px;">
            ⏰ LINK EXPIRES IN <strong style="color:#9ca3af;">24 HOURS</strong> &nbsp;|&nbsp; SINGLE USE ONLY
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#374151;text-align:center;line-height:1.6;">
      Didn't create an account? You can safely ignore this email — your address won't be used.
    </p>
    `,
    "Verify your Cykruit account — click to activate"
  );
