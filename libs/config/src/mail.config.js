"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// libs/config/mail.config.ts
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('mail', () => ({
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@cykruit.com',
}));
