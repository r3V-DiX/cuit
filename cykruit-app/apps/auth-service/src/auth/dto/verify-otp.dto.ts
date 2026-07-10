import { IsEmail, IsString, Length, IsOptional, IsBoolean, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class VerifyOtpDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsString()
  @Length(6, 6, { message: "OTP must be exactly 6 digits" })
  @Matches(/^\d{6}$/, { message: "OTP must be exactly 6 digits" })
  otp: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
