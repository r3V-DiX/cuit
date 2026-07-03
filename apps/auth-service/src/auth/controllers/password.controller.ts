// apps/auth-service/src/auth/controllers/password.controller.ts
// CHANGES FROM ORIGINAL: Added @ForgotPasswordRateLimit()

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { PasswordService } from "../services/password.service";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { Public } from "@cykruit/auth-core";
import { ErrorCodes } from "@cykruit/common";
import { ForgotPasswordRateLimit } from "@cykruit/rate-limit";

@Controller("auth")
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Public()
  @ForgotPasswordRateLimit()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto);
  }

  @Public()
  @Get("verify-reset-token")
  @HttpCode(HttpStatus.OK)
  async verifyResetToken(@Query("token") token: string) {
    if (!token)
      throw new BadRequestException({
        code: ErrorCodes.INVALID_TOKEN,
        message: "Reset token is required",
      });
    return this.passwordService.verifyResetToken(token);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }
}
