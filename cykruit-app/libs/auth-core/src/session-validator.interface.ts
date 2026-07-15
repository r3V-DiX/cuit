// libs/auth-core/src/session-validator.interface.ts
import type { Request } from "express";

/**
 * Abstract token for DI — AuthGuard depends on this interface.
 * apps/auth-service and apps/user-settings-service provide concrete implementations.
 */
export const SESSION_VALIDATOR = Symbol("SESSION_VALIDATOR");

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  profileImage?: string | null;
  isEmailVerified?: boolean;
}

export interface ISessionValidationResult {
  user: SessionUser;
  newToken?: string; // Present when session was rotated
  rememberMe?: boolean; // Forwarded so AuthGuard sets correct cookie maxAge on rotation
}

export interface ISessionValidator {
  validateSession(
    token: string,
    ipAddress?: string,
    userAgent?: string,
    req?: Request, // ✅ added — needed so fingerprint comparison can run in validators
  ): Promise<ISessionValidationResult>;
}
