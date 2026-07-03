"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetTemplate = void 0;
// libs/mail/src/templates/password-reset.template.ts
const base_template_1 = require("./base.template");
const cyber_button_template_1 = require("./cyber-button.template");
const passwordResetTemplate = (resetUrl) => (0, base_template_1.baseTemplate)(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-size:48px;margin-bottom:16px;">🔐</div>
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">Reset Your Password</h2>
      <p style="margin:0;font-size:15px;color:#64748b;">We received a request to reset your password</p>
    </div>

    <p style="margin:0 0 20px 0;color:#334155;">
      Click the button below to create a new password. This link is valid for <strong>1 hour</strong>.
    </p>

    ${(0, cyber_button_template_1.cyberButton)("Reset My Password", resetUrl)}

    <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        ⚠️ If you didn't request a password reset, please ignore this email. Your password will not be changed.
      </p>
    </div>

    <p style="margin:20px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:#1B3C8B;word-break:break-all;">${resetUrl}</a>
    </p>
  `);
exports.passwordResetTemplate = passwordResetTemplate;
