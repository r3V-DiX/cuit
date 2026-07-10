import { IsString, IsEmail, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateContactDto {
  @ApiProperty({
    description: "Full name of the contact person",
    example: "John Doe",
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: "Full name must be at least 2 characters long" })
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: "Email address of the contact person",
    example: "john.doe@example.com",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  email: string;

  @ApiProperty({
    description: "Message body",
    example: "I have a question about job listings on your platform.",
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: "Message must be at least 10 characters long" })
  @MaxLength(5000)
  message: string;
}
