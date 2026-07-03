import type { Request } from "express";
/**
 * Abstract token for DI — AuthGuard depends on this interface.
 * apps/auth-service and apps/user-settings-service provide concrete implementations.
 */
export declare const SESSION_VALIDATOR: unique symbol;
export interface ISessionValidationResult {
  user: any;
  newToken?: string;
}
export interface ISessionValidator {
  validateSession(
    token: string,
    ipAddress?: string,
    userAgent?: string,
    req?: Request,
  ): Promise<ISessionValidationResult>;
}
