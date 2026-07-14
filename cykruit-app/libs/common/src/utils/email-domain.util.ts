// libs/common/src/utils/email-domain.util.ts

const BLOCKED_EMAIL_DOMAINS = [
  // Google
  "gmail.com", "googlemail.com",
  // Yahoo
  "yahoo.com", "yahoo.in", "yahoo.co.in", "yahoo.co.uk", "ymail.com", "rocketmail.com",
  // Microsoft
  "hotmail.com", "hotmail.in", "hotmail.co.uk", "outlook.com", "outlook.in", "live.com", "live.in", "msn.com",
  // Apple
  "icloud.com", "me.com", "mac.com",
  // AOL
  "aol.com",
  // Privacy / encrypted
  "protonmail.com", "proton.me", "tutanota.com", "tutamail.com", "tuta.io", "hushmail.com",
  // Zoho / FastMail / GMX
  "zoho.com", "fastmail.com", "gmx.com", "gmx.net", "web.de",
  // Generic free
  "inbox.com", "mail.com", "libero.it",
  // Russian / Chinese
  "yandex.com", "yandex.ru", "qq.com", "163.com", "126.com",
  // Indian
  "rediffmail.com",
  // Disposable / temp
  "guerrillamail.com", "tempmail.com", "throwam.com", "sharklasers.com", "mailnull.com",
];

/**
 * Check if an email uses a blocked (personal/free) domain
 */
export function isBlockedEmailDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase());
}

/**
 * Extract domain from email address
 */
export function getEmailDomain(email: string): string {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1].toLowerCase();
}
