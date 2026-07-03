"use strict";
// libs/auth-core/src/utils/session.utils.ts
//
// SHARED SESSION UTILITIES
// Used by both auth-service and user-settings-service.
// Centralizes token hashing, raw token generation, and session expiry logic
// so any future change happens in one place.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRawToken = generateRawToken;
exports.hashToken = hashToken;
exports.resolveSessionExpiry = resolveSessionExpiry;
const crypto_1 = require("crypto");
/**
 * Generate a cryptographically secure random token.
 * @param bytes Number of random bytes (default 64 → 128 char hex string)
 */
function generateRawToken(bytes = 64) {
    return (0, crypto_1.randomBytes)(bytes).toString("hex");
}
/**
 * SHA-256 hash a raw token before storing in DB.
 * Raw token goes to the client (cookie/response).
 * Hashed token is stored in DB — never the raw one.
 */
function hashToken(rawToken) {
    return (0, crypto_1.createHash)("sha256").update(rawToken).digest("hex");
}
/**
 * Resolve session expiry date based on rememberMe flag.
 * rememberMe = true  → 30 days
 * rememberMe = false → 24 hours
 */
function resolveSessionExpiry(rememberMe) {
    return new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
}
