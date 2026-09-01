// libs/mail/src/templates/cyber-button.template.ts
import { COLORS, TYPOGRAPHY } from "./colors";

export const cyberButton = (text: string, url: string): string => `
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
