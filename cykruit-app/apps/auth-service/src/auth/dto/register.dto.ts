// apps/auth-service/src/auth/dto/register.dto.ts

import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Transform } from "class-transformer";
import { UserRole } from "@prisma/client";

@ValidatorConstraint({ name: "MatchPassword", async: false })
class MatchPassword implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const obj = args.object as any;
    return confirmPassword === obj.password;
  }
  defaultMessage() {
    return "Passwords do not match";
  }
}

export class RegisterDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      "Password must contain uppercase, lowercase, number and special character",
  })
  password: string;

  @IsString()
  @Validate(MatchPassword, { message: "Passwords do not match" })
  confirmPassword: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2, { message: "First name must be at least 2 characters" })
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      "First name can only contain letters, spaces, hyphens and apostrophes",
  })
  firstName: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(2, { message: "Last name must be at least 2 characters" })
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message:
      "Last name can only contain letters, spaces, hyphens and apostrophes",
  })
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Phone must be a valid international phone number",
  })
  phone: string;

  @IsEnum(UserRole, { message: "Role must be either SEEKER or EMPLOYER" })
  role: UserRole;
}
