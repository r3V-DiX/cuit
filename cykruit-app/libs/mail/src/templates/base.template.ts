// libs/mail/templates/base.template.ts
export const baseTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cykruit</title>
</head>
<body style="margin:0;padding:0;background:linear-gradient(135deg,#f1f5f9 0%,#e2e8f0 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="padding:40px 20px;">
    <div style="max-width:650px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.1);border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#1B3C8B 0%,#14306e 100%);padding:40px 30px;text-align:center;">
        <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:20px;display:inline-block;border:1px solid rgba(255,255,255,0.2);">
          <h1 style="margin:0;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:2px;">🚀 CYKRUIT</h1>
          <p style="margin:8px 0 0 0;font-size:14px;color:#dbeafe;letter-spacing:1px;">YOUR CYBERSECURITY JOB PORTAL</p>
        </div>
      </div>
      <div style="padding:40px 30px;color:#334155;line-height:1.7;font-size:15px;">
        ${content}
      </div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,#cbd5e1,transparent);margin:0 30px;"></div>
      <div style="background:#f8fafc;padding:30px;text-align:center;">
        <p style="margin:0 0 15px 0;font-size:13px;color:#64748b;">Questions? <a href="mailto:support@cykruit.com" style="color:#1B3C8B;text-decoration:none;">support@cykruit.com</a></p>
        <p style="margin:0;font-size:12px;color:#64748b;">© ${new Date().getFullYear()} Cykruit.com • All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
