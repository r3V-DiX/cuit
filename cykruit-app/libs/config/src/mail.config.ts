// libs/config/mail.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("mail", () => ({
  resendApiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
  supportEmail: process.env.SUPPORT_EMAIL || "support@cykruit.com",
}));
