import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { RateLimit } from "@cykruit/rate-limit";
import { Request } from "express";
import { ContactService } from "./contact.service";
import { CreateContactDto } from "./dto/create-contact.dto";

@ApiTags("contact")
@Controller("contact")
@Public()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ global: { ttl: 60 * 60_000, limit: 3 } }) // 3 submissions per IP per hour
  @ApiOperation({ summary: "Submit contact form" })
  @ApiResponse({
    status: 201,
    description: "Contact form submitted successfully.",
  })
  @ApiResponse({ status: 429, description: "Rate limit exceeded." })
  async submitContactForm(@Body() dto: CreateContactDto, @Req() req: Request) {
    // Retrieve IP and User-Agent
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    return this.contactService.createContactSubmission(dto, {
      ipAddress,
      userAgent,
    });
  }
}
