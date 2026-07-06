// apps/auth-service/src/auth/dto/device-session.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from "class-validator";
import { Transform } from "class-transformer";

/**
 * MobileLoginDto — same as LoginDto but includes device metadata.
 * All device fields are optional; the server degrades gracefully if absent.
 */
export class MobileLoginDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: "Invalid email address" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  // ── Device metadata (optional) ───────────────────────────

  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string; // "iPhone 14 Pro", "Samsung Galaxy S23"

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceModel?: string; // "iPhone15,2"

  @IsOptional()
  @IsString()
  @MaxLength(20)
  platform?: string; // "ios" | "android"

  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string; // "1.2.3"

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pushToken?: string; // FCM or APNs registration token
}

/**
 * RefreshTokenDto — provide refresh token to get a new access token.
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: "Refresh token is required" })
  refreshToken: string;
}

/**
 * UpdatePushTokenDto — called by mobile apps when FCM/APNs token rotates.
 */
export class UpdatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  pushToken: string;
}
