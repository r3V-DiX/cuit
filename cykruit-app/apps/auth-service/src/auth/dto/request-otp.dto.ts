import { IsEmail, IsIn, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { UserRole } from "@prisma/client";

export class RequestOtpDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsOptional()
  @IsIn([UserRole.SEEKER, UserRole.EMPLOYER], { message: "Role must be SEEKER or EMPLOYER" })
  role?: UserRole;

  @IsOptional()
  @IsIn(["login", "register"], { message: "flow must be login or register" })
  flow?: "login" | "register";
}
