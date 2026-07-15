// admin-app/src/admin/auth/dto/admin-login.dto.ts

import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class AdminLoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
