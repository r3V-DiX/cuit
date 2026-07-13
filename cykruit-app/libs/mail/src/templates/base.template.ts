// libs/mail/templates/base.template.ts

export const baseTemplate = (content: string, preheader = ""): string => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <title>Cykruit</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;" bgcolor="#f1f5f9">

  <!-- preheader (inbox preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f1f5f9;">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- top accent bar -->
          <tr>
            <td height="2" style="background:linear-gradient(90deg,#1d4ed8 0%,#3b82f6 50%,#1d4ed8 100%);border-radius:2px 2px 0 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- card body -->
          <tr>
            <td style="background-color:#ffffff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px;overflow:hidden;">

              <!-- header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <!-- shield box -->
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:12px;margin:0 auto 14px;text-align:center;line-height:48px;box-shadow:0 8px 24px rgba(37,99,235,0.25);">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fill-opacity="0.9"/>
                            </svg>
                          </div>
                          <p style="margin:0;font-size:20px;font-weight:800;color:#1e293b;letter-spacing:4px;font-family:'Courier New',monospace;">CYKRUIT</p>
                          <p style="margin:6px 0 0;font-size:10px;color:#64748b;letter-spacing:3px;font-family:'Courier New',monospace;text-transform:uppercase;">Cybersecurity Careers</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- content -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:40px;color:#374151;font-size:15px;line-height:1.75;">
                    ${content}
                  </td>
                </tr>
              </table>

              <!-- footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f8fafc">
                <tr>
                  <td style="padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;background-color:#f8fafc;">
                    <p style="margin:0 0 6px;font-size:12px;color:#64748b;">
                      Questions? <a href="mailto:support@cykruit.com" style="color:#3b82f6;text-decoration:none;">support@cykruit.com</a>
                    </p>
                    <p style="margin:0;font-size:10px;color:#94a3b8;font-family:'Courier New',monospace;letter-spacing:1px;">
                      &copy; ${new Date().getFullYear()} CYKRUIT &bull; ALL RIGHTS RESERVED
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
