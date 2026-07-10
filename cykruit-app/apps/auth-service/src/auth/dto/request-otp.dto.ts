import { IsEmail, IsIn } from "class-validator";
import { Transform } from "class-transformer";
import { UserRole } from "@prisma/client";

export class RequestOtpDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsIn([UserRole.SEEKER, UserRole.EMPLOYER], { message: "Role must be SEEKER or EMPLOYER" })
  role: UserRole;
}
