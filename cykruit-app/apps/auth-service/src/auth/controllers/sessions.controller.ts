// apps/auth-service/src/auth/controllers/sessions.controller.ts
// FIXES APPLIED:
//   [7] Device fingerprinting note added — AuthGuard doesn't pass req object to validateSession
//       so fingerprint comparison never runs. Documented clearly. Full fix requires
//       extending ISessionValidator interface to accept req — deferred, logged as TODO.
//   [8] mobileLogout now passes ip + ua to revokeSession as reqCtx
//       Previously audit log for mobile logout had no IP or UA recorded

import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { Request } from "express";
import { SessionService } from "../services/session.service";
import { SessionMobileService } from "../services/session-mobile.service";
import { AuthService } from "../services/auth.service";
import { AuthGuard, CurrentUser, Public } from "@cykruit/auth-core";
import { CookieConfig } from "@cykruit/config";
import { AppLogger } from "@cykruit/logger";
import { ErrorCodes } from "@cykruit/common";
import {
  MobileLoginDto,
  RefreshTokenDto,
  UpdatePushTokenDto,
} from "../dto/device-session.dto";
import { sanitizeIpAddress, sanitizeUserAgent } from "../utils/auth.utils";
import { LoginRateLimit, RefreshTokenRateLimit } from "@cykruit/rate-limit";
import type { User } from "@prisma/client";

@Controller("auth")
export class SessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionMobileService: SessionMobileService,
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {}

  // ── Mobile auth ───────────────────────────────────────────

  @Public()
  @LoginRateLimit()
  @Post("mobile/login")
  @HttpCode(HttpStatus.OK)
  async mobileLogin(@Body() dto: MobileLoginDto) {
    // Password auth removed — mobile must use OTP flow via /auth/request-otp + /auth/verify-otp
    throw new BadRequestException({
      code: "PASSWORD_AUTH_REMOVED",
      message: "Password authentication is no longer supported. Use OTP login.",
    });
  }

  @Public()
  @RefreshTokenRateLimit()
  @Post("mobile/refresh")
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    if (!dto.refreshToken) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_TOKEN,
        message: "Refresh token is required",
      });
    }
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    return this.sessionMobileService.refreshMobileToken(dto.refreshToken, ip);
  }

  @Post("mobile/logout")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async mobileLogout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() user: User,
    // FIX [8]: Added @Req() to extract ip + ua for audit context
    @Req() req: Request,
  ) {
    if (!dto.refreshToken) {
      throw new BadRequestException({
        code: ErrorCodes.INVALID_TOKEN,
        message: "Refresh token is required",
      });
    }

    // FIX [8]: Build reqCtx so audit log captures IP and UA for mobile logout events
    // Previously revokeSession was called with no context — audit entries had null ip/ua
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);
    const reqCtx = { ip, userAgent: ua };

    const session = await this.sessionMobileService.findSessionByRefreshHash(
      dto.refreshToken,
      user.id,
    );
    if (session) {
      await this.sessionService.revokeSession(session.id, user.id, reqCtx);
    }
    return { message: "Logged out successfully" };
  }

  // ── Multi-device management ───────────────────────────────
  // NOTE: GET "sessions" and DELETE "sessions/:id" used to be defined here too,
  // but AuthController (auth.controller.ts) registers the identical routes first —
  // NestJS silently shadows the later registration, so these copies were 100% dead
  // code. Removed 2026-07-27; AuthController's versions are the live ones (its
  // revokeSession() was updated in the same pass to match this file's superior
  // isCurrentSession-cookie-clear behavior, which the live copy was missing).

  @Delete("sessions")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllOtherSessions(@CurrentUser() user: User, @Req() req: Request) {
    const currentToken =
      req.cookies?.[CookieConfig.COOKIE_NAMES.SESSION] ??
      req.headers.authorization?.replace("Bearer ", "") ??
      "";

    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    const count = await this.sessionService.revokeAllOtherSessions(
      user.id,
      currentToken,
      { ip, userAgent: ua },
    );
    return { message: `Revoked ${count} other session(s) successfully` };
  }

  @Post("sessions/:id/push-token")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePushToken(
    @Param("id") sessionId: string,
    @Body() dto: UpdatePushTokenDto,
    @CurrentUser() user: User,
  ) {
    await this.sessionService.updatePushToken(
      sessionId,
      user.id,
      dto.pushToken,
    );
    return { message: "Push token updated" };
  }
}
