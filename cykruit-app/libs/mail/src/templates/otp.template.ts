// libs/mail/src/templates/otp.template.ts
import { baseTemplate } from "./base.template";

export const otpTemplate = (
  firstName: string,
  otp: string,
  expiresInMinutes: number,
  purpose: string,
): string =>
  baseTemplate(
    `
    <div style="text-align:left;margin-bottom:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.2px;">Verification code</h1>
      <p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">${purpose}</p>
    </div>

    <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
      ${firstName ? `${firstName}, use` : 'Use'} this code to verify your request. It expires in ${expiresInMinutes} minutes.
    </p>

    <!-- OTP block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;width:100%;">
      <tr>
        <td align="center" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:24px;">
          <p style="margin:0;font-size:36px;font-weight:600;color:#1d4ed8;letter-spacing:8px;text-align:center;">${otp}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background:#fff7ed;border-left:3px solid #f59e0b;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            Do not share this code. Cykruit will never ask for it outside of the login process.
          </p>
        </td>
      </tr>
    </table>
    `,
    `Your verification code is ${otp}`
  );