// apps/auth-service/src/auth/dto/forgot-password.dto.ts
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
}