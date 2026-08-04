// apps/auth-service/src/auth/controllers/oauth.controller.ts
// FIXES APPLIED:
//   [6] Google and GitHub callbacks now set the CSRF cookie after login
//       Previously only the session cookie was set — any authenticated request after
//       OAuth login (POST /auth/logout, PATCH /auth/change-password etc.) would get
//       403 CSRF_TOKEN_MISSING because the csrf_token cookie was never created
//   [5] Injects CsrfGuard to call generateToken() — same fix as auth.controller.ts

import {
  Controller,
  Get,
  Query,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { GoogleOAuthService } from "../services/oauth/google-oauth.service";
import { CsrfGuard, Public } from "@cykruit/auth-core";
import { CookieConfig } from "@cykruit/config";
import { AppLogger } from "@cykruit/logger";
import { UserRole } from "@prisma/client";
import { sanitizeIpAddress } from "../utils/auth.utils";
import { ErrorCodes } from "@cykruit/common";
import { OAuthRateLimit } from "@cykruit/rate-limit";

@Controller("auth")
export class OAuthController {
  private readonly appUrl: string;

  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly csrfGuard: CsrfGuard,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.resolveAppUrl(this.configService.get<string>('APP_URL'));
  }

  /** Robust APP_URL resolution — `??` only catches null/undefined, so an empty
   *  or bare "http://" value produced a broken "http:///auth/callback" redirect
   *  after Google OAuth. Fall back unless the value is a real absolute http(s)
   *  URL, then strip any trailing slash. */
  private resolveAppUrl(raw?: string): string {
    const value = raw || '';
    return /^https?:\/\/.+/.test(value) ? value.replace(/\/+$/, '') : 'http://localhost:3000';
  }

  // ── Google ──────────────────────────────────────────────────

  @Public()
  @OAuthRateLimit()
  @Get("google")
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Query("role") roleParam?: string) {
    try {
      const role = this.parseRole(roleParam);
      const { url } = await this.googleOAuthService.getAuthorizationUrl(role);
      this.logger.log(
        `Google OAuth URL generated for role: ${role}`,
        "OAuthController",
      );
      return {
        data: { url, provider: "google" },
        message: "Google OAuth URL generated",
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException({
        code: ErrorCodes.OAUTH_INIT_FAILED,
        message: "Failed to initialize Google OAuth. Please try again.",
      });
    }
  }

  @Public()
  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const appUrl = this.appUrl;
    if (!code || !state) {
      return res.redirect(`${appUrl}/login?error=oauth_params_missing`);
    }

    try {
      const ipAddress = sanitizeIpAddress(req.ip || req.socket.remoteAddress);
      const userAgent = req.headers["user-agent"];
      const result = await this.googleOAuthService.handleCallback(
        code,
        state,
        ipAddress,
        userAgent,
      );

      // Session cookie
      res.cookie(
        CookieConfig.COOKIE_NAMES.SESSION,
        result.sessionToken,
        CookieConfig.getSessionCookieOptions(false),
      );

      // FIX [6]: Set CSRF cookie — was missing, caused 403 on all subsequent mutating requests
      res.cookie(
        CookieConfig.COOKIE_NAMES.CSRF,
        this.csrfGuard.generateToken(),
        CookieConfig.getCsrfCookieOptions(),
      );

      res.cookie(
        CookieConfig.COOKIE_NAMES.ROLE,
        result.user.role,
        CookieConfig.getRoleCookieOptions(false),
      );

      this.logger.log(
        `Google OAuth successful: ${result.user.email}`,
        "OAuthController",
      );
      let callbackUrl = result.isNewUser
        ? `${appUrl}/auth/callback?new=1`
        : `${appUrl}/auth/callback`;

      if (result.domainMatchEmployer) {
        const sep = callbackUrl.includes("?") ? "&" : "?";
        callbackUrl += `${sep}domain_match=1&company=${encodeURIComponent(result.domainMatchEmployer.companyName)}`;
      }

      return res.redirect(callbackUrl);
    } catch (error) {
      this.logger.error(
        `Google OAuth failed: ${error.message}`,
        error.stack,
        "OAuthController",
      );
      const errorCode = error?.response?.code || error?.code || ErrorCodes.GOOGLE_AUTH_FAILED;
      return res.redirect(`${appUrl}/login?error=${errorCode}`);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private parseRole(roleParam?: string): UserRole {
    if (!roleParam) return UserRole.SEEKER;
    const upper = roleParam.toUpperCase();
    if (upper === "SEEKER" || upper === "EMPLOYER") return upper as UserRole;
    throw new BadRequestException({
      code: ErrorCodes.OAUTH_INVALID_ROLE,
      message: "Invalid role. Must be SEEKER or EMPLOYER",
    });
  }
}
