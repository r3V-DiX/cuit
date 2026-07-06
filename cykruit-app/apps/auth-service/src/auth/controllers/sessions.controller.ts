// apps/auth-service/src/auth/controllers/sessions.controller.ts
// FIXES APPLIED:
//   [7] Device fingerprinting note added — AuthGuard doesn't pass req object to validateSession
//       so fingerprint comparison never runs. Documented clearly. Full fix requires
//       extending ISessionValidator interface to accept req — deferred, logged as TODO.
//   [8] mobileLogout now passes ip + ua to revokeSession as reqCtx
//       Previously audit log for mobile logout had no IP or UA recorded

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { Request, Response } from "express";
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
import { DeviceType } from "../types/session.types";
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
  async mobileLogin(@Body() dto: MobileLoginDto, @Req() req: Request) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    const loginResult = await this.authService.login(
      { email: dto.email, password: dto.password },
      ip,
      ua,
    );

    return this.sessionMobileService.createMobileSession(
      loginResult.data.user.id,
      loginResult.data.user,
      ip,
      {
        deviceType: DeviceType.MOBILE,
        deviceName: dto.deviceName,
        deviceModel: dto.deviceModel,
        platform: dto.platform,
        appVersion: dto.appVersion,
        pushToken: dto.pushToken,
      },
    );
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

  @Get("sessions")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async listSessions(@CurrentUser() user: User, @Req() req: Request) {
    const currentToken =
      req.cookies?.[CookieConfig.COOKIE_NAMES.SESSION] ??
      req.headers.authorization?.replace("Bearer ", "") ??
      "";

    // FIX [7] NOTE: Device fingerprinting is captured on session creation but comparison
    // is not active in the auth guard path because AuthGuard calls validateSession(token, ip, ua)
    // without a Request object. To enable fingerprint comparison, ISessionValidator interface
    // would need to accept Request. Current behaviour: fingerprint stored, never compared.
    // TODO: extend ISessionValidator.validateSession to accept optional req: Request
    const sessions = await this.sessionService.listUserSessions(
      user.id,
      currentToken,
    );
    return { data: sessions, message: `${sessions.length} active session(s)` };
  }

  @Delete("sessions/:id")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param("id") sessionId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentToken = req.cookies?.[CookieConfig.COOKIE_NAMES.SESSION];
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    const isCurrentSession = currentToken
      ? await this.sessionService.isTokenForSession(currentToken, sessionId)
      : false;

    await this.sessionService.revokeSession(sessionId, user.id, {
      ip,
      userAgent: ua,
    });

    if (isCurrentSession) {
      res.clearCookie(
        CookieConfig.COOKIE_NAMES.SESSION,
        CookieConfig.getClearCookieOptions(),
      );
    }

    return { message: "Session revoked successfully" };
  }

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
