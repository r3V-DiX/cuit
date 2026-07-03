/**
 * Generate a cryptographically secure random token.
 * @param bytes Number of random bytes (default 64 → 128 char hex string)
 */
export declare function generateRawToken(bytes?: number): string;
/**
 * SHA-256 hash a raw token before storing in DB.
 * Raw token goes to the client (cookie/response).
 * Hashed token is stored in DB — never the raw one.
 */
export declare function hashToken(rawToken: string): string;
/**
 * Resolve session expiry date based on rememberMe flag.
 * rememberMe = true  → 30 days
 * rememberMe = false → 24 hours
 */
export declare function resolveSessionExpiry(rememberMe: boolean): Date;
