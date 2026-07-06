// apps/auth-service/src/auth/dto/verify-email.dto.ts
import { IsString, IsNotEmpty } from "class-validator";

export class VerifyEmailDto {
  @IsString({ message: "Token must be a string" })
  @IsNotEmpty({ message: "Token is required" })
  token: string;
}
