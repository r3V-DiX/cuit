// libs/mail/src/templates/base.template.ts
import { COLORS, TYPOGRAPHY } from "./colors";

export const baseTemplate = (content: string, preheader = ""): string => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <!--[if gte mso 15]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <style type="text/css">
    body, table tr, table td, a, span, table.MsoNormalTable {
      font-family: 'Inter Tight', Helvetica, Arial, sans-serif !important;
    }
  </style>
  <![endif]-->
  <title>Cykruit</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!--<![endif]-->
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <style type="text/css">
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      text-rendering: optimizeLegibility;
      box-sizing: border-box;
    }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100%;
    }
    table, th {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      border: none;
      margin: 0 auto;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: none !important;
      outline: none !important;
      text-decoration: none !important;
    }
    *[x-apple-data-detectors], .x-gmail-data-detectors, .x-gmail-data-detectors *, .aBn {
      border-bottom: none !important;
      cursor: default !important;
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    u #body a {
      color: inherit;
      text-decoration: none;
    }
    p { margin: 0px !important; padding: 0px !important; }
    td, a, span { border-collapse: collapse; mso-line-height-rule: exactly; }
    .cykruit-btn:hover {
      background-color: ${COLORS.ACCENT_STRONG} !important;
    }
    @media only screen and (max-width:600px) {
      .me_main_table {
        width: 100% !important;
      }
      .me_wrapper {
        width: 100% !important;
        max-width: 100% !important;
      }
      .me_wrapper_two {
        width: 100% !important;
        max-width: 100% !important;
        display: block !important;
      }
      .me_hide {
        display: none !important;
      }
      .me_side_space {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
</head>
<body class="me_body" style="min-width: 100%; background-color: ${COLORS.CANVAS}; margin: 0 auto !important; padding: 0;">
  <!-- Preheader Preview text -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:${COLORS.CANVAS};">
    ${preheader ? preheader : "Cykruit Notification"}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table class="me_full_wrap" width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="background-color: ${COLORS.CANVAS};">
    <tr>
      <td align="center" valign="top" style="padding: 24px 12px;">
        <table align="center" class="me_main_table" width="600" border="0" cellspacing="0" cellpadding="0" style="table-layout:fixed; background-color: ${COLORS.PAPER}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <!-- Header / Logo section -->
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50" class="me_hide">&nbsp;</td>
                        <td valign="top" class="me_side_space" style="padding-top: 36px; padding-bottom: 24px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center">
                                <a target="_blank" style="text-decoration: none; display: inline-block;" href="https://cykruit.com">
                                  <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="vertical-align: middle; padding-right: 10px;">
                                        <div style="width: 38px; height: 38px; background-color: ${COLORS.BRAND_PRIMARY}; border-radius: 9px; text-align: center; line-height: 38px;">
                                          <span style="font-size: 22px; color: #ffffff;">🛡️</span>
                                        </div>
                                      </td>
                                      <td style="vertical-align: middle;">
                                        <span style="font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 24px; font-weight: 800; color: ${COLORS.BRAND_PRIMARY}; letter-spacing: -0.5px;">Cykruit</span>
                                      </td>
                                    </tr>
                                  </table>
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50" class="me_hide">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50" class="me_hide">&nbsp;</td>
                        <td valign="top" class="me_side_space" style="padding-bottom: 36px;">
                          ${content}
                        </td>
                        <td width="50" class="me_hide">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Dark Footer -->
                <tr>
                  <td bgcolor="${COLORS.FOOTER_BG}" style="background-color: ${COLORS.FOOTER_BG};">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="40" class="me_hide">&nbsp;</td>
                        <td valign="top" class="me_side_space" style="padding: 36px 12px 30px;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <!-- Footer Logo & Links row -->
                            <tr>
                              <td style="padding-bottom: 20px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td class="me_wrapper_two" valign="middle" align="center" style="padding-bottom: 12px;">
                                      <a target="_blank" style="text-decoration: none; color: #ffffff; font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;" href="https://cykruit.com">
                                        <span style="color:#ffffff;">🛡️ Cykruit</span>
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <!-- Social Icons -->
                            <tr>
                              <td align="center" style="padding-bottom: 20px;">
                                <table align="center" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="padding: 0 8px;">
                                      <a target="_blank" href="https://linkedin.com/company/cykruit" style="text-decoration: none; color: ${COLORS.FOOTER_TEXT}; font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 13px; font-weight: 600;">LinkedIn</a>
                                    </td>
                                    <td style="color: ${COLORS.FOOTER_MUTED};">•</td>
                                    <td style="padding: 0 8px;">
                                      <a target="_blank" href="https://twitter.com/cykruit" style="text-decoration: none; color: ${COLORS.FOOTER_TEXT}; font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 13px; font-weight: 600;">Twitter (X)</a>
                                    </td>
                                    <td style="color: ${COLORS.FOOTER_MUTED};">•</td>
                                    <td style="padding: 0 8px;">
                                      <a target="_blank" href="https://github.com/cykruit" style="text-decoration: none; color: ${COLORS.FOOTER_TEXT}; font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 13px; font-weight: 600;">GitHub</a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <!-- Navigation Links -->
                            <tr>
                              <td style="font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 13px; text-align: center; color: ${COLORS.FOOTER_TEXT}; font-weight: 400; line-height: 20px; padding-bottom: 16px;">
                                <a href="https://cykruit.com/about" target="_blank" style="color: ${COLORS.FOOTER_TEXT}; text-decoration: underline;">About us</a>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                <a href="https://cykruit.com/jobs" target="_blank" style="color: ${COLORS.FOOTER_TEXT}; text-decoration: underline;">Jobs</a>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                <a href="https://cykruit.com/contact" target="_blank" style="color: ${COLORS.FOOTER_TEXT}; text-decoration: underline;">Contact us</a>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                <a href="https://cykruit.com/privacy" target="_blank" style="color: ${COLORS.FOOTER_TEXT}; text-decoration: underline;">Privacy Policy</a>
                              </td>
                            </tr>

                            <!-- Copyright & Address -->
                            <tr>
                              <td style="font-family: ${TYPOGRAPHY.FONT_PRIMARY}; font-size: 11px; text-align: center; color: ${COLORS.FOOTER_MUTED}; font-weight: 400; line-height: 16px; padding-bottom: 8px;">
                                &copy; ${new Date().getFullYear()} Cykruit Inc. Cybersecurity Careers & Talent Platform.<br/>
                                All rights reserved.
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="40" class="me_hide">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <div style="display:none; white-space:nowrap; font:20px courier; color:#dbdbdb; background-color:#dbdbdb;">- - - - - - - - - - - - - - - - - - - - - - -</div>
</body>
</html>
`;

