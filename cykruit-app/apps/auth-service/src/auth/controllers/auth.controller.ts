// apps/auth-service/src/auth/controllers/auth.controller.ts

import {
    Controller, Post, Get, Patch, Delete, Body, Res, Req,
    UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '@cykruit/common';
import { RegisterDto } from '../dto/register.dto';
import { AuthGuard, CsrfGuard, CurrentUser, Public } from '@cykruit/auth-core';
import { CookieConfig } from '@cykruit/config';
import { sanitizeIpAddress, sanitizeUserAgent } from '../utils/auth.utils';
import { LoginRateLimit, RegisterRateLimit, SkipRateLimit } from '@cykruit/rate-limit';
import { IsString, IsEmail, IsBoolean, IsOptional } from 'class-validator';
import type { User } from '@prisma/client';

class RequestOtpDto {
    @IsEmail() email: string;
}

class VerifyOtpDto {
    @IsEmail() email: string;
    @IsString() otp: string;
    @IsOptional() @IsBoolean() rememberMe?: boolean;
}

class DeleteAccountDto {
    @IsOptional() @IsString() password?: string;
}

class DeactivateAccountDto {
    @IsOptional() @IsString() password?: string;
}

// Kept for backwards compatibility — OTP users won't have passwords
class ChangePasswordDto {
    @IsString() currentPassword: string;
    @IsString() newPassword: string;
    @IsString() confirmPassword: string;
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly csrfGuard: CsrfGuard,
    ) { }

    @Public()
    @RegisterRateLimit()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @LoginRateLimit()
    @Post('request-otp')
    @HttpCode(HttpStatus.OK)
    async requestOtp(@Body() dto: RequestOtpDto, @Req() req: Request) {
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);
        return this.authService.requestOtp(dto.email, ip, ua);
    }

    @Public()
    @LoginRateLimit()
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(
        @Body() dto: VerifyOtpDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);

        const result = await this.authService.verifyOtp(
            dto.email, dto.otp, dto.rememberMe ?? false, ip, ua, req,
        );

        res.cookie(
            CookieConfig.COOKIE_NAMES.SESSION,
            result.data.sessionToken,
            CookieConfig.getSessionCookieOptions(dto.rememberMe ?? false),
        );

        res.cookie(
            CookieConfig.COOKIE_NAMES.CSRF,
            this.csrfGuard.generateToken(),
            CookieConfig.getCsrfCookieOptions(),
        );

        return { data: result.data.user, message: result.message };
    }

    @Get('me')
    @UseGuards(AuthGuard)
    @SkipRateLimit({ global: true })
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@CurrentUser() user: User) {
        return this.authService.getCurrentUser(user.id);
    }

    @Get('ws-token')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getWebSocketToken(@CurrentUser() user: User) {
        const wsToken = this.tokenService.createWsToken(user.id, user.email, user.role);
        return {
            token: wsToken,
            expiresIn: '5m',
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
    }

    @Post('logout')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @CurrentUser() user: User,
    ) {
        const sessionToken = req.cookies[CookieConfig.COOKIE_NAMES.SESSION];
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);

        if (sessionToken) {
            await this.authService.logout(sessionToken, user.id, { ip, userAgent: ua });
        }

        res.clearCookie(CookieConfig.COOKIE_NAMES.SESSION, CookieConfig.getClearCookieOptions());
        res.clearCookie(CookieConfig.COOKIE_NAMES.CSRF, CookieConfig.getClearCsrfCookieOptions());

        return { message: 'Logout successful' };
    }

    @Post('logout-all')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async logoutFromAllDevices(
        @CurrentUser() user: User,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);

        await this.authService.logoutFromAllDevices(user.id, { ip, userAgent: ua });

        res.clearCookie(CookieConfig.COOKIE_NAMES.SESSION, CookieConfig.getClearCookieOptions());
        res.clearCookie(CookieConfig.COOKIE_NAMES.CSRF, CookieConfig.getClearCsrfCookieOptions());

        return { message: 'Logged out from all devices successfully' };
    }

    @Patch('change-password')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @Body() dto: ChangePasswordDto,
        @CurrentUser() user: User,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const currentSessionToken = req.cookies[CookieConfig.COOKIE_NAMES.SESSION];

        await this.passwordService.changePassword(
            user.id,
            dto.currentPassword,
            dto.newPassword,
            dto.confirmPassword,
            currentSessionToken,
        );

        res.clearCookie(CookieConfig.COOKIE_NAMES.SESSION, CookieConfig.getClearCookieOptions());
        res.clearCookie(CookieConfig.COOKIE_NAMES.CSRF, CookieConfig.getClearCsrfCookieOptions());

        return { message: 'Password changed successfully. Please login again.' };
    }

    @Patch('deactivate')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async deactivateAccount(
        @Body() dto: DeactivateAccountDto,
        @CurrentUser() user: User,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);

        await this.authService.deactivateAccount(user.id, dto.password, { ip, userAgent: ua });

        res.clearCookie(CookieConfig.COOKIE_NAMES.SESSION, CookieConfig.getClearCookieOptions());
        res.clearCookie(CookieConfig.COOKIE_NAMES.CSRF, CookieConfig.getClearCsrfCookieOptions());

        return { message: 'Account deactivated successfully. You can reactivate by logging in again.' };
    }

    @Post('cancel-deletion')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async cancelDeletion(
        @CurrentUser() user: User,
        @Req() req: Request,
    ) {
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);

        return this.authService.cancelDeletion(user.id, { ip, userAgent: ua });
    }

    @Delete('account')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteAccount(
        @Body() dto: DeleteAccountDto,
        @CurrentUser() user: User,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ip = sanitizeIpAddress(req.ip ?? req.socket.remoteAddress);
        const ua = sanitizeUserAgent(req.headers['user-agent']);

        await this.authService.deleteAccount(user.id, dto.password, { ip, userAgent: ua });

        res.clearCookie(CookieConfig.COOKIE_NAMES.SESSION, CookieConfig.getClearCookieOptions());
        res.clearCookie(CookieConfig.COOKIE_NAMES.CSRF, CookieConfig.getClearCsrfCookieOptions());

        return { message: 'Your account has been scheduled for deletion in 30 days.' };
    }
}