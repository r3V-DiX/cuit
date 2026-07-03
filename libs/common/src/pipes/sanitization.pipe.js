"use strict";
// libs/common/src/pipes/sanitization.pipe.ts
//
// REDESIGN: Context-aware sanitization instead of blanket stripping.
//
// OLD PROBLEM: Stripping <>"' from ALL fields breaks:
//   - Company descriptions with HTML
//   - Job descriptions with formatting
//   - Any rich text field added in future services
//
// NEW APPROACH:
//   AUTH fields (email, names, phone, role) → strict sanitization
//   CONTENT fields (description, about, message) → XSS-clean only (DOMPurify logic)
//   PASSWORD / TOKEN fields → null bytes only, never modified
//   URL fields → trim only
//   Everything else → strip actual injection patterns, allow normal punctuation
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizationPipe = void 0;
const common_1 = require("@nestjs/common");
// ── Patterns ──────────────────────────────────────────────────
// Always strip — null bytes break everything
const NULL_BYTE_RE = /\0/g;
// Script injection — strip from everything
const SCRIPT_TAG_RE = /<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi;
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*["'][^"']*["']/gi; // onclick="...", onload='...'
const JAVASCRIPT_PROTO_RE = /javascript\s*:/gi;
const DATA_URI_RE = /data\s*:\s*text\/html/gi;
// SQL injection keywords — only in auth-specific string context
const SQL_INJECTION_RE = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|GRANT|REVOKE)\b)/gi;
// HTML entity decode attacks
const HTML_ENTITY_RE = /&(#?[a-zA-Z0-9]+);/g;
// ── Field classification ───────────────────────────────────────
// Auth fields — strict: only safe chars allowed
const PASSWORD_FIELDS = new Set([
    'password', 'confirmPassword', 'currentPassword', 'newPassword',
]);
const TOKEN_FIELDS = new Set([
    'token', 'resetToken', 'verificationToken', 'accessToken',
    'refreshToken', 'pushToken', 'csrfToken',
]);
const EMAIL_FIELDS = new Set(['email', 'newEmail', 'contactEmail']);
const STRICT_STRING_FIELDS = new Set([
    'firstName', 'lastName', 'phone', 'role', 'provider',
    'platform', 'appVersion', 'deviceName', 'deviceModel',
]);
// Content fields — allow HTML-ish content, just strip XSS
const RICH_TEXT_FIELDS = new Set([
    'description', 'about', 'mission', 'vision', 'message',
    'content', 'body', 'html', 'cultureDescription', 'tagline',
    'professionalSummary', 'note', 'adminNotes', 'rejectionReason',
    'closedReason', 'bio', 'summary', 'overview',
]);
// URL fields — trim only, don't strip special chars
const URL_FIELDS = new Set([
    'url', 'redirectUrl', 'callbackUrl', 'profileImage', 'companyLogo',
    'companyBanner', 'companyWebsite', 'linkedin', 'twitter', 'facebook',
    'instagram', 'github', 'portfolio', 'projectUrl', 'credentialUrl',
    'actionUrl', 'externalUrl', 'fileUrl', 'documentUrl',
]);
// ── Allowed patterns for strict fields ────────────────────────
const EMAIL_ALLOWED_RE = /^[a-zA-Z0-9@._\-+]+$/;
const NAME_ALLOWED_RE = /^[a-zA-Z0-9\s'\-\.]+$/;
// Strict string: block actual injection chars but allow normal punctuation
const STRICT_DANGEROUS_RE = /[<>"`;\\|$(){}[\]^*!=~]/g;
let SanitizationPipe = class SanitizationPipe {
    transform(value, metadata) {
        if (metadata.type !== 'body' && metadata.type !== 'query')
            return value;
        if (value === null || value === undefined)
            return value;
        return this.sanitizeValue(value, metadata.data);
    }
    sanitizeValue(value, fieldName) {
        if (typeof value === 'string') {
            return this.sanitizeString(value, fieldName);
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeValue(item));
        }
        if (typeof value === 'object' && value !== null) {
            const sanitized = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = this.sanitizeValue(val, key);
            }
            return sanitized;
        }
        return value;
    }
    sanitizeString(value, fieldName) {
        // Step 1: always strip null bytes
        let s = value.replace(NULL_BYTE_RE, '');
        // Step 2: passwords and tokens — ONLY null bytes, never touch anything else
        if (fieldName && (PASSWORD_FIELDS.has(fieldName) || TOKEN_FIELDS.has(fieldName))) {
            return s;
        }
        // Step 3: URL fields — trim only, strip script protocols
        if (fieldName && URL_FIELDS.has(fieldName)) {
            s = s.replace(JAVASCRIPT_PROTO_RE, '').replace(DATA_URI_RE, '').trim();
            return s;
        }
        // Step 4: Rich text / content fields — strip XSS vectors only, keep HTML structure
        if (fieldName && RICH_TEXT_FIELDS.has(fieldName)) {
            s = s
                .replace(NULL_BYTE_RE, '')
                .replace(SCRIPT_TAG_RE, '')
                .replace(EVENT_HANDLER_RE, '')
                .replace(JAVASCRIPT_PROTO_RE, '')
                .replace(DATA_URI_RE, '');
            return s.trim();
        }
        // Step 5: Email fields — lowercase, strict char set
        if (fieldName && EMAIL_FIELDS.has(fieldName)) {
            s = s.toLowerCase().trim();
            s = s
                .replace(SCRIPT_TAG_RE, '')
                .replace(NULL_BYTE_RE, '');
            if (s && !EMAIL_ALLOWED_RE.test(s)) {
                throw new common_1.BadRequestException({
                    code: 'INVALID_EMAIL_FORMAT',
                    message: 'Invalid characters in email address.',
                });
            }
            return s;
        }
        // Step 6: Strict string fields (names, phone, etc.)
        if (fieldName && STRICT_STRING_FIELDS.has(fieldName)) {
            s = s
                .replace(SCRIPT_TAG_RE, '')
                .replace(NULL_BYTE_RE, '')
                .replace(STRICT_DANGEROUS_RE, '')
                .replace(SQL_INJECTION_RE, '')
                .trim();
            if (fieldName === 'firstName' || fieldName === 'lastName') {
                if (s && !NAME_ALLOWED_RE.test(s)) {
                    throw new common_1.BadRequestException({
                        code: 'INVALID_NAME_FORMAT',
                        message: `Invalid characters in ${fieldName}.`,
                    });
                }
            }
            return s;
        }
        // Step 7: General fields (unknown field names, IDs, slugs, etc.)
        // Strip actual injection patterns but allow normal punctuation like , . - _ ( )
        s = s
            .replace(SCRIPT_TAG_RE, '')
            .replace(EVENT_HANDLER_RE, '')
            .replace(JAVASCRIPT_PROTO_RE, '')
            .replace(NULL_BYTE_RE, '')
            .replace(SQL_INJECTION_RE, '')
            .trim();
        return s;
    }
};
exports.SanitizationPipe = SanitizationPipe;
exports.SanitizationPipe = SanitizationPipe = __decorate([
    (0, common_1.Injectable)()
], SanitizationPipe);
