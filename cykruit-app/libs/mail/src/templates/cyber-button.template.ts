// libs/mail/templates/cyber-button.template.ts
export const cyberButton = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto;">
    <tr>
      <td align="center" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:8px;box-shadow:0 4px 20px rgba(37,99,235,0.35);">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="16%" stroke="f" fill="t"><v:fill type="gradient" color="#2563eb" color2="#1d4ed8" angle="135"/><w:anchorlock/><center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;">${text}</center></v:roundrect><![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" style="display:inline-block;padding:15px 44px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;border-radius:8px;">
          ${text}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
`;
