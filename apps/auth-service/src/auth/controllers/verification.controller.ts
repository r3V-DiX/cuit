// apps/auth-service/src/auth/controllers/verification.controller.ts
// FIX: verifyEmail — result.data.sessionToken is optional (verification doesn't auto-login)
// Only set cookie if sessionToken actually exists

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { VerificationService } from "../services/verification.service";
import { VerifyEmailDto } from "../dto/verify-email.dto";
import { ResendVerificationDto } from "../dto/resend-verification.dto";
import { CsrfGuard, Public } from "@cykruit/auth-core";
import { CookieConfig } from "@cykruit/config";
import { sanitizeIpAddress, sanitizeUserAgent } from "../utils/auth.utils";
import {
  VerifyEmailRateLimit,
  ResendVerificationRateLimit,
} from "@cykruit/rate-limit";

@Controller("auth")
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly csrfGuard: CsrfGuard,
  ) {}

  @Public()
  @VerifyEmailRateLimit()
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = sanitizeIpAddress(
      req.ip ?? req.socket.remoteAddress ?? "unknown",
    );
    const ua = sanitizeUserAgent(req.headers["user-agent"] ?? "unknown");

    const result = await this.verificationService.verifyEmail(dto, ip, ua);

    // Auto-login — set both session + CSRF cookies
    if (result.data?.sessionToken) {
      res.cookie(
        CookieConfig.COOKIE_NAMES.SESSION,
        result.data.sessionToken,
        CookieConfig.getSessionCookieOptions(false),
      );
      res.cookie(
        CookieConfig.COOKIE_NAMES.CSRF,
        this.csrfGuard.generateToken(),
        CookieConfig.getCsrfCookieOptions(),
      );
    }

    return { data: result.data?.user ?? null, message: result.message };
  }

  @Public()
  @ResendVerificationRateLimit()
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @Req() req: Request,
  ) {
    const ip = sanitizeIpAddress(
      req.ip ?? req.socket.remoteAddress ?? "unknown",
    );
    const ua = sanitizeUserAgent(req.headers["user-agent"] ?? "unknown");

    // FIX: service now accepts (dto, ip?, ua?) — was (dto) but service expected (email, reqCtx)
    return this.verificationService.resendVerification(dto, ip, ua);
  }

  @Public()
  @Get("check-verification")
  @HttpCode(HttpStatus.OK)
  async checkVerificationStatus(@Query("email") email: string) {
    return this.verificationService.checkVerificationStatus(email);
  }
}
