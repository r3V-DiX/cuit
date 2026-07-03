"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employerInviteTemplate = void 0;
// libs/mail/src/templates/employer-invite.template.ts
const base_template_1 = require("./base.template");
const cyber_button_template_1 = require("./cyber-button.template");
const employerInviteTemplate = (inviteeName, inviterName, companyName, companyLogo, assignedRole, inviteUrl, expiresInHours) => (0, base_template_1.baseTemplate)(`
    <div style="text-align:center;margin-bottom:30px;">
      ${companyLogo
    ? `<img src="${companyLogo}" alt="${companyName} Logo" style="max-height:60px;margin-bottom:16px;border-radius:8px;" />`
    : `<div style="font-size:48px;margin-bottom:16px;">💼</div>`}
      <h2 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#1B3C8B;">Join ${companyName}</h2>
      <p style="margin:0;font-size:15px;color:#64748b;">You've been invited to join the team on Cykruit</p>
    </div>

    <p style="margin:0 0 20px 0;color:#334155;font-size:15px;">
      Hello ${inviteeName},
    </p>
    <p style="margin:0 0 20px 0;color:#334155;line-height:1.6;">
      <strong>${inviterName}</strong> has invited you to join the team of <strong>${companyName}</strong> on Cykruit as a <strong>${assignedRole}</strong>.
    </p>
    <p style="margin:0 0 30px 0;color:#334155;line-height:1.6;">
      As a team member, you will be able to post jobs, view applicant profiles, schedule interviews, and collaborate on hiring.
    </p>

    ${(0, cyber_button_template_1.cyberButton)("Accept Invite", inviteUrl)}

    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3C8B;">
      <p style="margin:0;font-size:13px;color:#475569;">
        ⏰ This invitation link is valid for <strong>${expiresInHours} hours</strong>. If you did not expect this invitation, you can ignore this email safely.
      </p>
    </div>

    <p style="margin:20px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${inviteUrl}" style="color:#1B3C8B;word-break:break-all;">${inviteUrl}</a>
    </p>
  `);
exports.employerInviteTemplate = employerInviteTemplate;
