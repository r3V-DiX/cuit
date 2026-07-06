// libs/auth-core/src/utils/device-fingerprint.util.ts
//
// DEVICE FINGERPRINTING
//
// What it does:
//   Creates a stable, anonymous hash from request headers that identifies
//   the browser/device combination without tracking the user personally.
//
// What we hash:
//   - User-Agent (browser + OS)
//   - Accept-Language (locale)
//   - Accept-Encoding (browser capability signal)
//   - sec-ch-ua (client hints — Chrome/Edge only)
//   - sec-ch-ua-platform (OS via client hints)
//
// What we DON'T use:
//   - IP address (changes too often on mobile)
//   - Cookies (circular dependency)
//   - Canvas/WebGL fingerprinting (requires JS, server-side only here)
//
// Mismatch handling:
//   LOW confidence   → block + revoke session (completely different browser/device)
//   MEDIUM confidence → allow through (minor browser update, UA changed slightly)
//   HIGH confidence  → perfect match, allow through

import { createHash } from "crypto";
import type { Request } from "express";

export interface DeviceFingerprint {
  hash: string;
  components: {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    secChUa: string;
    secChUaPlatform: string;
  };
}

export function generateDeviceFingerprint(req: Request): DeviceFingerprint {
  const components = {
    userAgent: normalizeHeader(req.headers["user-agent"]),
    acceptLanguage: normalizeHeader(req.headers["accept-language"]),
    acceptEncoding: normalizeHeader(req.headers["accept-encoding"]),
    secChUa: normalizeHeader(req.headers["sec-ch-ua"]),
    secChUaPlatform: normalizeHeader(req.headers["sec-ch-ua-platform"]),
  };

  // Stable serialization — order is fixed so header order doesn't affect hash
  const payload = [
    components.userAgent,
    components.acceptLanguage,
    components.acceptEncoding,
    components.secChUa,
    components.secChUaPlatform,
  ].join("|");

  const hash = createHash("sha256")
    .update(payload)
    .digest("hex")
    .substring(0, 32);

  return { hash, components };
}

export function compareFingerprints(
  stored: string,
  current: string,
): {
  match: boolean;
  confidence: "high" | "medium" | "low";
} {
  if (stored === current) {
    return { match: true, confidence: "high" };
  }

  // Partial match — first 16 chars match means UA changed slightly (e.g. browser update)
  if (stored.substring(0, 16) === current.substring(0, 16)) {
    return { match: false, confidence: "medium" };
  }

  // Completely different — different browser or device entirely
  return { match: false, confidence: "low" };
}

function normalizeHeader(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] ?? "";
  return value.substring(0, 200); // cap length to prevent hash bombing
}
