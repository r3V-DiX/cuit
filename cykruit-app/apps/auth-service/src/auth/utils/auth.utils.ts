// apps/auth-service/src/auth/utils/auth.utils.ts
//
// CHANGES FROM PREVIOUS VERSION:
//   - generateRawToken REMOVED — moved to libs/auth-core/src/utils/session.utils.ts
//     Use generateRawToken from @cykruit/auth-core instead

export function parseTimeToMs(time: string): number {
  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1), 10);
  switch (unit) {
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Standard user response shape used across all auth endpoints.
 * Includes: id, email, names, role, verification, status, phone,
 *           profileImage, lastLogin, isOAuthUser (no password set),
 *           authProviders (google / github).
 */
export function formatUserResponse(user: any) {
  const hasPassword = user.password && user.password !== "";
  const oauthProviders = user.userOAuthProviders || [];
  const primaryProvider = oauthProviders.length > 0 ? oauthProviders[0].provider : null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    phone: user.phone ?? null,
    profileImage: user.profileImage ?? null,
    hasPassword: !!hasPassword,
    provider: primaryProvider,
    isEmailVerified: user.isEmailVerified ?? false,
    lastLogin: user.lastLogin ?? null,
    createdAt: user.createdAt ?? null,
  };
}

export function getTokenExpiration(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function isDateExpired(date: Date): boolean {
  return new Date() > date;
}

export function sanitizeIpAddress(ip: string | undefined): string {
  if (!ip) return "unknown";
  if (ip.startsWith("::ffff:")) return ip.substring(7);
  return ip;
}

export function sanitizeUserAgent(userAgent: string | undefined): string {
  if (!userAgent) return "unknown";
  return userAgent.substring(0, 255);
}
