"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpTemplate = void 0;
// libs/mail/src/templates/otp.template.ts
const base_template_1 = require("./base.template");
const otpTemplate = (firstName, otp, expiresInMinutes, purpose) => (0, base_template_1.baseTemplate)(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;margin-bottom:16px;">🔑</div>
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">Verification Code</h2>
      <p style="margin:0;font-size:15px;color:#64748b;">Here is your security code for ${purpose.toLowerCase()}</p>
    </div>

    <p style="margin:0 0 20px 0;color:#334155;font-size:15px;">
      Hello ${firstName || "User"},
    </p>
    <p style="margin:0 0 30px 0;color:#334155;line-height:1.6;">
      You requested a verification code to use with Cykruit. Please use the following code to complete your verification:
    </p>

    <div style="text-align:center;margin:30px 0;">
      <div style="display:inline-block;background:#f1f5f9;border:2px dashed #1B3C8B;color:#1B3C8B;font-family:monospace;font-size:36px;font-weight:700;letter-spacing:6px;padding:16px 40px;border-radius:12px;">
        ${otp}
      </div>
    </div>

    <div style="background:#fdf2f2;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #ef4444;">
      <p style="margin:0;font-size:13px;color:#991b1b;font-weight:500;">
        ⏰ This code is valid for <strong>${expiresInMinutes} minutes</strong>. 
      </p>
    </div>

    <p style="margin:20px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">
      <strong>Security notice:</strong> If you did not request this code, someone may have entered your email address by mistake. You can safely ignore this email. Do not share this code with anyone.
    </p>
  `);
exports.otpTemplate = otpTemplate;
