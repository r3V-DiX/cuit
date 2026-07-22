// libs/auth-core/src/utils/session.utils.ts
//
// SHARED SESSION UTILITIES
// Used by both auth-service and user-settings-service.
// Centralizes token hashing, raw token generation, and session expiry logic
// so any future change happens in one place.

import { randomBytes, createHash } from "crypto";
import type { PrismaService } from "@cykruit/prisma";
import { getPolicyInt } from "@cykruit/policy-config";

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
 * rememberMe = true  → session_max_lifetime_days (PolicyConfig, default 30 days)
 * rememberMe = false → 24 hours (fixed — not a "remembered" session, not policy-driven)
 */
export async function resolveSessionExpiry(rememberMe: boolean): Promise<Date> {
  if (!rememberMe) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  const maxLifetimeDays = await getPolicyInt("session_max_lifetime_days", 30);
  return new Date(Date.now() + maxLifetimeDays * 24 * 60 * 60 * 1000);
}

/** How long a just-rotated-away token still authenticates a request. */
export const SESSION_GRACE_PERIOD_MS = 60 * 1000;

/**
 * Look up a session by its current token, falling back to the token it was
 * JUST rotated away from (within the grace window). Without this fallback,
 * any request already in flight when a concurrent request triggers rotation
 * gets rejected as "session not found" even though the session is valid —
 * see docs/SESSION_MEMORY.md for the full incident.
 *
 * ponytail: this doesn't cover the rarer case of two requests reading the
 * row before either write commits (both deciding to rotate at once). That
 * window is a few ms wide and self-corrects on the next request; a real fix
 * needs an atomic compare-and-swap (e.g. SELECT ... FOR UPDATE) if it's ever
 * observed in practice.
 */
export async function findSessionWithGracePeriod(
  prisma: PrismaService,
  hashedToken: string,
) {
  const current = await prisma.session.findFirst({
    where: { token: hashedToken, isActive: true },
  });
  if (current) return current;

  return prisma.session.findFirst({
    where: {
      previousToken: hashedToken,
      previousTokenExpiresAt: { gt: new Date() },
      isActive: true,
    },
  });
}
