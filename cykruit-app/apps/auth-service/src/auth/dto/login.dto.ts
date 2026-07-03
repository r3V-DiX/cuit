// apps/auth-service/src/auth/dto/login.dto.ts
import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
    @Transform(({ value }) => value?.toLowerCase().trim())
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @IsString({ message: 'Password must be a string' })
    password: string;

    @IsOptional()
    @IsBoolean({ message: 'Remember me must be a boolean' })
    rememberMe?: boolean;
}