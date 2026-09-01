const fs = require('fs');
const path = require('path');

// Colors
const COLORS = {
  CANVAS: "#ececec",
  PAPER: "#f7f7f7",
  CARD_WHITE: "#ffffff",
  PAPER_BORDER: "#dbdfe4",
  PAPER_SHADOW: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
  INK: "#000000",
  BODY: "#4a5568",
  MUTED: "#718096",
  MUTED_LIGHTER: "#a0aec0",
  BRAND_PRIMARY: "#1B3C8B",
  BRAND_ACCENT: "#2563eb",
  BRAND_HIGHLIGHT: "#3b82f6",
  ACCENT: "#1B3C8B",
  ACCENT_STRONG: "#122a63",
  ACCENT_LIGHT: "#f0f4ff",
  ACCENT_BORDER: "#d0ddff",
  FOOTER_BG: "#000000",
  FOOTER_TEXT: "#718096",
  FOOTER_MUTED: "#4a5568",
  SUCCESS: "#059669",
  SUCCESS_LIGHT: "#ecfdf5",
  SUCCESS_BORDER: "#a7f3d0",
  WARNING: "#d97706",
  WARNING_LIGHT: "#fffbeb",
  WARNING_BORDER: "#f59e0b",
  WARNING_TEXT: "#92400e",
  ERROR: "#dc2626",
  ERROR_LIGHT: "#fef2f2",
  ERROR_BORDER: "#fecaca",
  ERROR_TEXT: "#991b1b",
};

const TYPOGRAPHY = {
  FONT_PRIMARY: "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  FONT_FAMILY: "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  FONT_SERIF: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  FONT_MONO: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  HEADING_WEIGHT: "800",
  HEADING_LETTERSPACING: "-0.5px",
  BODY_SIZE: "16px",
  BODY_LINEHEIGHT: "26px",
  SMALL_SIZE: "12px",
  SMALL_LINESPACING: "18px",
  META_SIZE: "13px",
  META_LETTERSPACING: "0.8px",
  META_UPPERCASE: "uppercase",
};

const baseTemplate = (content, preheader = "") => `
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

const cyberButton = (text, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 0; width: 100%;">
    <tr>
      <td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="12%" stroke="f" fillcolor="${COLORS.BRAND_PRIMARY}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;font-weight:700;letter-spacing:0.5px;">
            ${text}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; width: 100%; max-width: 320px;">
          <tr>
            <td valign="middle" bgcolor="${COLORS.BRAND_PRIMARY}" height="52" style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:15px;font-weight:700;text-align:center;border-radius:8px;background-color:${COLORS.BRAND_PRIMARY};box-shadow: 0 2px 6px rgba(27,60,139,0.25);">
              <a href="${url}" target="_blank" style="text-decoration:none;color:#ffffff;display:block;line-height:52px;letter-spacing:0.5px;padding: 0 24px;">
                ${text}
              </a>
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
`;

const verificationTemplate = (verifyUrl) => baseTemplate(`
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
        ACCOUNT VERIFICATION
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
        Confirm Your Email to Secure Your <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Account</span>
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
        Thanks for signing up with Cykruit! To complete your registration and activate your access to the cybersecurity ecosystem, please click the button below.
      </td>
    </tr>
    <tr>
      <td align="center">
        ${cyberButton("VERIFY &amp; CONTINUE", verifyUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
        Didn’t sign up for this? No worries — simply ignore this message.<br/>
        <span style="font-size:12px;color:${COLORS.MUTED_LIGHTER};">Link expires in 24 hours.</span>
      </td>
    </tr>
  </table>
`, "Confirm your email address to secure your Cykruit account");

const otpTemplate = (firstName, otp, expiresInMinutes, purpose) => baseTemplate(`
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
        ${purpose || "SECURITY VERIFICATION"}
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
        Your One-Time <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Passcode</span>
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
        ${firstName ? `Hi ${firstName}, use` : "Use"} the verification code below to authorize your session. This code will expire in ${expiresInMinutes} minutes.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto; width: 100%; max-width: 320px;">
          <tr>
            <td align="center" style="background-color:#ffffff;border:1px solid #DBDFE4;border-radius:10px;padding:22px 16px;box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
              <span style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:36px;font-weight:800;color:${COLORS.BRAND_PRIMARY};letter-spacing:10px;display:block;">
                ${otp}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color:${COLORS.WARNING_LIGHT};border:1px solid ${COLORS.WARNING_BORDER};border-radius:8px;padding:14px 18px;text-align:center;">
        <p style="margin:0;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;color:${COLORS.WARNING_TEXT};line-height:20px;">
          🔒 <strong>Security Warning:</strong> Never share this code with anyone. Cykruit staff will never ask for your verification code.
        </p>
      </td>
    </tr>
  </table>
`, `Your verification code is ${otp}`);

const passwordResetTemplate = (resetUrl) => baseTemplate(`
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
        ACCOUNT RECOVERY
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
        Reset Your Cykruit <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Password</span>
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
        We received a request to reset your password. Click the button below to choose a new password for your account. This link will expire in 1 hour.
      </td>
    </tr>
    <tr>
      <td align="center">
        ${cyberButton("RESET PASSWORD", resetUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
        If you did not request this password reset, you can safely ignore this email. Your account remains secure.
      </td>
    </tr>
  </table>
`, "Reset your Cykruit password");

const passwordChangedTemplate = (firstName, loginUrl) => baseTemplate(`
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.SUCCESS};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
        SECURITY UPDATE
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
        Password Changed <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Successfully</span>
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
        ${firstName ? `Hi ${firstName}, your` : "Your"} Cykruit account password was successfully updated. You can now log in using your new credentials.
      </td>
    </tr>
    <tr>
      <td align="center">
        ${cyberButton("LOG IN TO CYKRUIT", loginUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding-top:32px;">
        <table border="0" cellspacing="0" cellpadding="0" width="100%">
          <tr>
            <td style="background-color:${COLORS.ERROR_LIGHT};border:1px solid ${COLORS.ERROR_BORDER};border-radius:8px;padding:14px 18px;text-align:center;">
              <p style="margin:0;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;color:${COLORS.ERROR_TEXT};line-height:20px;">
                ⚠️ <strong>Didn't make this change?</strong> Please contact our security support team immediately at <a href="mailto:support@cykruit.com" style="color:${COLORS.ERROR_TEXT};font-weight:700;text-decoration:underline;">support@cykruit.com</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`, "Your Cykruit password was changed");

const employerInviteTemplate = (inviteeName, inviterName, companyName, companyLogo, assignedRole, inviteUrl, expiresInHours) => baseTemplate(`
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:13px;text-align:center;color:${COLORS.BRAND_PRIMARY};font-weight:700;line-height:22px;text-transform:uppercase;letter-spacing:1px;padding-bottom:10px;">
        TEAM INVITATION
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:32px;text-align:center;color:${COLORS.INK};font-weight:800;line-height:42px;padding-bottom:12px;">
        Join ${companyName} on <span style="font-family:${TYPOGRAPHY.FONT_SERIF};color:${COLORS.BRAND_PRIMARY};font-style:italic;">Cykruit</span>
      </td>
    </tr>
    <tr>
      <td style="font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:16px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:26px;padding-bottom:28px;">
        Hi ${inviteeName.split(" ")[0]}, <strong>${inviterName}</strong> has invited you to collaborate on the <strong>${companyName}</strong> hiring team as a <strong>${assignedRole}</strong>.
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        <table border="0" cellspacing="0" cellpadding="0" style="margin:0 auto; width: 100%; max-width: 440px; background-color: #ffffff; border: 1px solid ${COLORS.PAPER_BORDER}; border-radius: 10px; padding: 20px;">
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED}; border-bottom: 1px solid #f1f5f9;">Company</td>
                  <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.INK}; border-bottom: 1px solid #f1f5f9;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED}; border-bottom: 1px solid #f1f5f9;">Assigned Role</td>
                  <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.BRAND_PRIMARY}; border-bottom: 1px solid #f1f5f9;">${assignedRole}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED}; border-bottom: 1px solid #f1f5f9;">Invited By</td>
                  <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.INK}; border-bottom: 1px solid #f1f5f9;">${inviterName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; color:${COLORS.MUTED};">Expires In</td>
                  <td align="right" style="padding: 6px 0; font-family:${TYPOGRAPHY.FONT_PRIMARY}; font-size:14px; font-weight:700; color:${COLORS.INK};">${expiresInHours} hours</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center">
        ${cyberButton("ACCEPT INVITATION", inviteUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding-top:32px;font-family:${TYPOGRAPHY.FONT_PRIMARY};font-size:14px;text-align:center;color:${COLORS.MUTED};font-weight:400;line-height:24px;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </td>
    </tr>
  </table>
`, `${inviterName} invited you to join ${companyName} on Cykruit`);

const outputDir = path.join(__dirname, '../email-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const previews = {
  'verification.html': verificationTemplate('https://cykruit.com/auth/verify?token=example-token-12345'),
  'otp.html': otpTemplate('Alex', '948-219', 10, 'Login Verification Code'),
  'password-reset.html': passwordResetTemplate('https://cykruit.com/auth/reset-password?token=example-reset-token'),
  'password-changed.html': passwordChangedTemplate('Alex', 'https://cykruit.com/login'),
  'employer-invite.html': employerInviteTemplate('Sarah Connor', 'John Doe', 'CrowdStrike Systems', null, 'Hiring Manager', 'https://cykruit.com/invite/accept?token=invite-9876', 48),
};

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
    <h1>🛡️ Cykruit Email Templates Preview Gallery</h1>
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
console.log(`Generated ${Object.keys(previews).length} previews successfully in ${outputDir}`);
