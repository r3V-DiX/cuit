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
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">Your verification code</h1>
      <p style="margin:0;font-size:14px;color:#64748b;font-family:'Courier New',monospace;letter-spacing:1px;">${purpose.toUpperCase()}</p>
    </div>

    <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.75;text-align:center;">
      Hey <strong style="color:#1e293b;">${firstName || "there"}</strong>, use this code to complete your verification. Do not share it with anyone.
    </p>

    <!-- OTP block -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 32px;">
      <tr>
        <td align="center" style="background:#f0f4ff;border:2px solid rgba(37,99,235,0.4);border-radius:12px;padding:22px 48px;">
          <p style="margin:0;font-size:40px;font-weight:800;color:#1e293b;font-family:'Courier New',monospace;letter-spacing:12px;text-align:center;">${otp}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);border-left:3px solid #2563eb;border-radius:0 8px 8px 0;padding:14px 16px;">
          <p style="margin:0;font-size:12px;color:#374151;font-family:'Courier New',monospace;letter-spacing:0.5px;">
            ⏰ EXPIRES IN <strong style="color:#1e293b;">${expiresInMinutes} MINUTES</strong> &nbsp;|&nbsp; SINGLE USE ONLY &nbsp;|&nbsp; DO NOT SHARE
          </p>
        </td>
      </tr>
    </table>
    `,
    `Your ${otp} verification code — expires in ${expiresInMinutes} min`
  );
