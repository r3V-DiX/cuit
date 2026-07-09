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
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:64px;height:64px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.3);border-radius:16px;text-align:center;line-height:64px;margin-bottom:20px;">
        <span style="font-size:28px;display:inline-block;vertical-align:middle;">🔑</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">Your verification code</h1>
      <p style="margin:0;font-size:14px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:1px;">${purpose.toUpperCase()}</p>
    </div>

    <p style="margin:0 0 28px;color:#9ca3af;font-size:15px;line-height:1.75;text-align:center;">
      Hey <strong style="color:#f1f5f9;">${firstName || "there"}</strong>, use this code to complete your verification. Do not share it with anyone.
    </p>

    <!-- OTP block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px;">
      <tr>
        <td align="center" style="background:#0b1120;border:2px solid rgba(37,99,235,0.5);border-radius:12px;padding:22px 48px;">
          <p style="margin:0;font-size:40px;font-weight:800;color:#f1f5f9;font-family:'Courier New',monospace;letter-spacing:12px;text-align:center;">${otp}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#4b5563;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            ⏰ EXPIRES IN <strong style="color:#9ca3af;">${expiresInMinutes} MINUTES</strong> &nbsp;|&nbsp; SINGLE USE ONLY &nbsp;|&nbsp; DO NOT SHARE
          </p>
        </td>
      </tr>
    </table>
    `,
    `Your ${otp} verification code — expires in ${expiresInMinutes} min`
  );
