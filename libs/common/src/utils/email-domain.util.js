"use strict";
// libs/common/src/utils/email-domain.util.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlockedEmailDomain = isBlockedEmailDomain;
exports.getEmailDomain = getEmailDomain;
const BLOCKED_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'me.com', 'mac.com', 'msn.com',
    'ymail.com', 'rocketmail.com', 'inbox.com', 'mail.com',
    'protonmail.com', 'proton.me', 'tutanota.com', 'tutamail.com',
    'zoho.com', 'fastmail.com', 'hushmail.com', 'guerrillamail.com',
    'tempmail.com', 'throwam.com', 'sharklasers.com', 'mailnull.com',
    'yandex.com', 'yandex.ru', 'qq.com', '163.com', '126.com',
    'rediffmail.com', 'gmx.com', 'gmx.net', 'web.de', 'libero.it',
];
/**
 * Check if an email uses a blocked (personal/free) domain
 */
function isBlockedEmailDomain(email) {
    const domain = getEmailDomain(email);
    if (!domain)
        return false;
    return BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase());
}
/**
 * Extract domain from email address
 */
function getEmailDomain(email) {
    if (!email || !email.includes('@'))
        return '';
    return email.split('@')[1].toLowerCase();
}
