export const cyberButton = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto;">
    <tr>
      <td align="center" style="background-color:#1d4ed8;border-radius:8px;">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="16%" stroke="f" fillcolor="#1d4ed8"><w:anchorlock/><center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:600;">${text}</center></v:roundrect><![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;border-radius:8px;background-color:#1d4ed8;">
          ${text}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
`;