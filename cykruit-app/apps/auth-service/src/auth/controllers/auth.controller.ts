import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Res,
  Req,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { OtpService } from "../services/otp.service";
import { SessionService } from "../services/session.service";
import { TokenService } from "@cykruit/common";
import { RequestOtpDto } from "../dto/request-otp.dto";
import { VerifyOtpDto } from "../dto/verify-otp.dto";
import { AuthGuard, CsrfGuard, CurrentUser, Public } from "@cykruit/auth-core";
import { CookieConfig } from "@cykruit/config";
import { sanitizeIpAddress, sanitizeUserAgent } from "../utils/auth.utils";
import {
  RequestOtpRateLimit,
  VerifyOtpRateLimit,
  SkipRateLimit,
} from "@cykruit/rate-limit";
import { IsString, IsOptional } from "class-validator";
import type { User } from "@prisma/client";

class DeleteAccountDto {
  @IsOptional() @IsString() confirmPhrase?: string;
}

class DeactivateAccountDto {
  @IsOptional() @IsString() confirmPhrase?: string;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly csrfGuard: CsrfGuard,
  ) {}

  @Public()
  @RequestOtpRateLimit()
  @Post("request-otp")
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);
    return this.otpService.requestOtp(dto.email, dto.role, ip, ua);
  }

  @Public()
  @VerifyOtpRateLimit()
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    const result = await this.otpService.verifyOtp(
      dto.email,
      dto.otp,
      dto.firstName,
      dto.lastName,
      dto.rememberMe ?? false,
      ip,
      ua,
      req,
    );

    res.cookie(
      CookieConfig.COOKIE_NAMES.SESSION,
      result.data.sessionToken,
      CookieConfig.getSessionCookieOptions(dto.rememberMe),
    );
    res.cookie(
      CookieConfig.COOKIE_NAMES.CSRF,
      this.csrfGuard.generateToken(),
      CookieConfig.getCsrfCookieOptions(),
    );
    res.cookie(
      CookieConfig.COOKIE_NAMES.ROLE,
      result.data.user.role,
      CookieConfig.getRoleCookieOptions(dto.rememberMe),
    );

    return { data: { ...result.data.user, isNewUser: result.isNewUser }, message: result.message };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @SkipRateLimit({ global: true })
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@CurrentUser() user: User) {
    return this.authService.getCurrentUser(user.id);
  }

  @Get("ws-token")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getWebSocketToken(@CurrentUser() user: User) {
    const wsToken = this.tokenService.createWsToken(
      user.id,
      user.email,
      user.role,
    );
    return {
      token: wsToken,
      expiresIn: "5m",
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  @Post("logout")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: User,
  ) {
    const sessionToken = req.cookies[CookieConfig.COOKIE_NAMES.SESSION];
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    if (sessionToken) {
      await this.authService.logout(sessionToken, user.id, {
        ip,
        userAgent: ua,
      });
    }

    res.clearCookie(
      CookieConfig.COOKIE_NAMES.SESSION,
      CookieConfig.getClearCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.CSRF,
      CookieConfig.getClearCsrfCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.ROLE,
      CookieConfig.getClearRoleCookieOptions(),
    );

    return { message: "Logout successful" };
  }

  @Post("logout-all")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutFromAllDevices(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    await this.authService.logoutFromAllDevices(user.id, { ip, userAgent: ua });

    res.clearCookie(
      CookieConfig.COOKIE_NAMES.SESSION,
      CookieConfig.getClearCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.CSRF,
      CookieConfig.getClearCsrfCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.ROLE,
      CookieConfig.getClearRoleCookieOptions(),
    );

    return { message: "Logged out from all devices successfully" };
  }

  @Get("sessions")
  @UseGuards(AuthGuard)
  async listSessions(@CurrentUser() user: User, @Req() req: Request) {
    const rawToken = req.cookies[CookieConfig.COOKIE_NAMES.SESSION] ?? "";
    return { data: await this.sessionService.listUserSessions(user.id, rawToken) };
  }

  @Get("sessions/history")
  @UseGuards(AuthGuard)
  async getSessionHistory(
    @CurrentUser() user: User,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit ?? "20", 10) || 20));
    return this.sessionService.getLoginHistory(user.id, p, l);
  }

  @Delete("sessions/others")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(@CurrentUser() user: User, @Req() req: Request) {
    const rawToken = req.cookies[CookieConfig.COOKIE_NAMES.SESSION] ?? "";
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);
    const count = await this.sessionService.revokeAllOtherSessions(user.id, rawToken, { ip, userAgent: ua });
    return { message: `Signed out of ${count} other device(s).`, count };
  }

  @Delete("sessions/:id")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param("id") sessionId: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);
    await this.sessionService.revokeSession(sessionId, user.id, { ip, userAgent: ua });
    return { message: "Session revoked successfully." };
  }

  @Patch("deactivate")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    await this.authService.deactivateAccount(user.id, {
      ip,
      userAgent: ua,
    });

    res.clearCookie(
      CookieConfig.COOKIE_NAMES.SESSION,
      CookieConfig.getClearCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.CSRF,
      CookieConfig.getClearCsrfCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.ROLE,
      CookieConfig.getClearRoleCookieOptions(),
    );

    return {
      message: "Account deactivated successfully. Contact support to reactivate.",
    };
  }

  @Post("cancel-deletion")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelDeletion(@CurrentUser() user: User, @Req() req: Request) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    return this.authService.cancelDeletion(user.id, { ip, userAgent: ua });
  }

  @Delete("account")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
    const ua = sanitizeUserAgent(req.headers["user-agent"]);

    await this.authService.deleteAccount(user.id, {
      ip,
      userAgent: ua,
    });

    res.clearCookie(
      CookieConfig.COOKIE_NAMES.SESSION,
      CookieConfig.getClearCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.CSRF,
      CookieConfig.getClearCsrfCookieOptions(),
    );
    res.clearCookie(
      CookieConfig.COOKIE_NAMES.ROLE,
      CookieConfig.getClearRoleCookieOptions(),
    );

    return {
      message: "Your account has been scheduled for deletion in 30 days.",
    };
  }
}
