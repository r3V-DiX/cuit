/* Hallmark · component: email-shell · genre: modern-minimal
 * Macrostructure: letter (single-card email)
 */

import { COLORS, TYPOGRAPHY, SPACING } from "./colors";

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
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    .cykruit-btn:hover { background-color: ${COLORS.ACCENT_STRONG} !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.CANVAS};font-family:${TYPOGRAPHY.FONT_FAMILY};" bgcolor="${COLORS.CANVAS}">

  <!-- preheader (inbox preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${COLORS.CANVAS};">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${COLORS.CANVAS}">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

          <!-- card body -->
          <tr>
            <td style="background-color:${COLORS.PAPER};border:1px solid ${COLORS.PAPER_BORDER};border-radius:12px;">

              <!-- header / logo row -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" style="padding:${SPACING.CARD_PADDING} ${SPACING.CARD_PADDING} 0 ${SPACING.CARD_PADDING};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                            <rect width="24" height="24" rx="6" fill="#1B3C8B"/>
                            <path d="M12 4.5L6.5 7V11.5C6.5 15.1 8.8 18.4 12 19.5C15.2 18.4 17.5 15.1 17.5 11.5V7L12 4.5Z" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:20px;font-weight:800;color:#1B3C8B;letter-spacing:-0.5px;line-height:1;">Cykruit</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- content area -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:${SPACING.CARD_PADDING};">
                    ${content}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:${TYPOGRAPHY.SMALL_SIZE};color:${COLORS.MUTED_LIGHTER};font-family:${TYPOGRAPHY.FONT_FAMILY};">
                &copy; ${new Date().getFullYear()} Cykruit &mdash; All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:${TYPOGRAPHY.SMALL_SIZE};color:${COLORS.MUTED_LIGHTER};font-family:${TYPOGRAPHY.FONT_FAMILY};">
                If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
