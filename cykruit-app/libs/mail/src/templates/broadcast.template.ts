// libs/mail/src/templates/broadcast.template.ts
import { baseTemplate } from "./base.template";

export const broadcastTemplate = (
  subject: string,
  contentHtml: string,
  preheader?: string,
): string => {
  return baseTemplate(
    `
    <h2 style="color:#1B3C8B;margin:0 0 20px 0;font-size:24px;font-weight:700;line-height:1.3;">
      ${subject}
    </h2>
    <div style="font-size:15px;line-height:1.6;color:#334155;" class="cykruit-broadcast-content">
      ${contentHtml}
    </div>
    `,
    preheader || subject,
  );
};
