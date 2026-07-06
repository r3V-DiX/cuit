// libs/auth-core/src/utils/session.utils.ts
//
// SHARED SESSION UTILITIES
// Used by both auth-service and user-settings-service.
// Centralizes token hashing, raw token generation, and session expiry logic
// so any future change happens in one place.

import { randomBytes, createHash } from "crypto";

/**
 * Generate a cryptographically secure random token.
 * @param bytes Number of random bytes (default 64 → 128 char hex string)
 */
export function generateRawToken(bytes: number = 64): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * SHA-256 hash a raw token before storing in DB.
 * Raw token goes to the client (cookie/response).
 * Hashed token is stored in DB — never the raw one.
 */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Resolve session expiry date based on rememberMe flag.
 * rememberMe = true  → 30 days
 * rememberMe = false → 24 hours
 */
export function resolveSessionExpiry(rememberMe: boolean): Date {
  return new Date(
    Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
  );
}
