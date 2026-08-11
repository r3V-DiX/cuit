// admin-app/src/modules/auth/dto/verify-admin-otp.dto.ts

import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyAdminOtpDto {
    @IsEmail()
    email: string;

    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/)
    otp: string;

    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
