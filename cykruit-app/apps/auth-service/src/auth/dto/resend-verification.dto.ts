// apps/auth-service/src/auth/dto/resend-verification.dto.ts
import { IsEmail } from "class-validator";

export class ResendVerificationDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;
}
