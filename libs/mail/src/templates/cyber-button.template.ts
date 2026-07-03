// libs/mail/templates/cyber-button.template.ts
export const cyberButton = (text: string, url: string): string => `
  <div style="text-align:center;margin:30px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1B3C8B 0%,#14306e 100%);color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(27,60,139,0.3);">
      ${text}
    </a>
  </div>
`;
