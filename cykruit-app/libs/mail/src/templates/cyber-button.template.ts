/* Hallmark · component: CTA-button · genre: modern-minimal
 * states: default · hover
 */

import { COLORS, TYPOGRAPHY, SPACING } from "./colors";

export const cyberButton = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
    <tr>
      <td align="center" style="background-color:${COLORS.ACCENT};border-radius:8px;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:auto;min-width:200px;" arcsize="16%" stroke="f" fillcolor="${COLORS.ACCENT}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:${TYPOGRAPHY.FONT_FAMILY};font-size:15px;font-weight:600;padding:14px 40px;">
            ${text}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}"
           style="display:inline-block;padding:${SPACING.BUTTON_PADDING};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${TYPOGRAPHY.FONT_FAMILY};border-radius:8px;background-color:${COLORS.ACCENT};">
          ${text}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
`;
