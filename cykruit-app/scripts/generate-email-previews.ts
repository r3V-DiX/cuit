import * as fs from 'fs';
import * as path from 'path';

import { verificationTemplate } from '../libs/mail/src/templates/verification.template';
import { otpTemplate } from '../libs/mail/src/templates/otp.template';
import { passwordResetTemplate } from '../libs/mail/src/templates/password-reset.template';
import { passwordChangedTemplate } from '../libs/mail/src/templates/password-changed.template';
import { employerInviteTemplate } from '../libs/mail/src/templates/employer-invite.template';
import { adminInviteTemplate } from '../libs/mail/src/templates/admin-invite.template';
import { companyJoinRequestTemplate } from '../libs/mail/src/templates/company-join-request.template';
import { jobReviewTemplate } from '../libs/mail/src/templates/job-review.template';
import { notificationTemplate } from '../libs/mail/src/templates/notification.template';
import { accountDeletionScheduledTemplate } from '../libs/mail/src/templates/account-deletion-scheduled.template';
import { broadcastTemplate } from '../libs/mail/src/templates/broadcast.template';

const outputDir = path.join(__dirname, '../email-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const previews: Record<string, string> = {
  'verification.html': verificationTemplate('https://cykruit.com/auth/verify?token=example-token-12345'),
  'otp.html': otpTemplate('Alex', '948-219', 10, 'Login Verification Code'),
  'password-reset.html': passwordResetTemplate('https://cykruit.com/auth/reset-password?token=example-reset-token'),
  'password-changed.html': passwordChangedTemplate('Alex', 'https://cykruit.com/login'),
  'employer-invite.html': employerInviteTemplate(
    'Sarah Connor',
    'John Doe',
    'CrowdStrike Systems',
    null,
    'Hiring Manager',
    'https://cykruit.com/invite/accept?token=invite-9876',
    48
  ),
  'admin-invite.html': adminInviteTemplate(
    'sec-ops@cykruit.com',
    'Alex Vance',
    'https://cykruit.com/admin/accept-invite?token=adm-5544',
    24
  ),
  'company-join-request.html': companyJoinRequestTemplate(
    'Marcus',
    'Elena Rostova',
    'elena@sentinelone.com',
    'SentinelOne',
    'https://cykruit.com/employer/settings/team'
  ),
  'job-review.html': jobReviewTemplate({
    adminFirstName: 'Rachel',
    jobTitle: 'Lead Cloud Security Architect',
    companyName: 'Palo Alto Networks',
    jobType: 'Full-time',
    workMode: 'Remote (US/EU)',
    isResubmission: false,
    reviewUrl: 'https://cykruit.com/admin/jobs/review/job-441'
  }),
  'notification.html': notificationTemplate(
    'Your application for Senior Penetration Tester at Mandiant has been moved to the Interview Stage.',
    'https://cykruit.com/seeker/applications/mandiant-pentest',
    'Alex'
  ),
  'account-deletion-scheduled.html': accountDeletionScheduledTemplate(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    'https://cykruit.com/login'
  ),
  'broadcast.html': broadcastTemplate(
    'Exciting New Platform Features & Salary Insights for 2026',
    '<p>We are thrilled to announce new cybersecurity salary intelligence benchmarks and direct hiring manager messaging.</p><p>Explore updated benchmarks in your profile dashboard today!</p>'
  )
};

// Generate Index Gallery page
let indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cykruit Email Template Gallery</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px 20px; margin: 0; }
    .container { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #ffffff; }
    p { color: #94a3b8; margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; text-decoration: none; color: inherit; transition: all 0.2s ease; display: block; }
    .card:hover { border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .card h3 { margin: 0 0 6px 0; font-size: 17px; color: #60a5fa; }
    .card span { font-size: 13px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ Cykruit Email Templates Preview</h1>
    <p>Click any template below to view the rendered HTML email in your browser.</p>
    <div class="grid">
`;

for (const [filename, html] of Object.entries(previews)) {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, html, 'utf-8');
  const title = filename.replace('.html', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  indexHtml += `      <a class="card" href="${filename}" target="_blank">
        <h3>${title}</h3>
        <span>${filename}</span>
      </a>\n`;
}

indexHtml += `    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml, 'utf-8');
console.log(`✅ Successfully generated ${Object.keys(previews).length} email previews in: ${outputDir}`);
console.log(`Open: file://${path.join(outputDir, 'index.html')}`);
