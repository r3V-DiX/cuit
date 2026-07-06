// libs/mail/src/templates/verification.template.ts
import { baseTemplate } from "./base.template";
import { cyberButton } from "./cyber-button.template";

export const verificationTemplate = (verifyUrl: string): string =>
  baseTemplate(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;margin-bottom:16px;">✉️</div>
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">Verify Your Email</h2>
      <p style="margin:0;font-size:15px;color:#64748b;">Welcome to Cykruit — the #1 cybersecurity job portal</p>
    </div>

    <p style="margin:0 0 20px 0;color:#334155;">
      Thanks for signing up! Please click the button below to verify your email address and activate your account.
    </p>

    ${cyberButton("Verify My Email", verifyUrl)}

    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3C8B;">
      <p style="margin:0;font-size:13px;color:#475569;">
        ⏰ This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>

    <p style="margin:20px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${verifyUrl}" style="color:#1B3C8B;word-break:break-all;">${verifyUrl}</a>
    </p>
  `);
