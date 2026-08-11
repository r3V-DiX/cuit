// admin-app/src/modules/auth/dto/request-admin-otp.dto.ts

import { IsEmail } from 'class-validator';

export class RequestAdminOtpDto {
    @IsEmail()
    email: string;
}
