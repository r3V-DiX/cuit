import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { MailService } from "@cykruit/mail";
import { ConfigService } from "@nestjs/config";
import { CreateContactDto } from "./dto/create-contact.dto";
import { AppLogger } from "@cykruit/logger";

@Injectable()
export class ContactService {
  private readonly adminEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.adminEmail =
      this.configService.get<string>("ADMIN_EMAIL") || "admin@cykruit.com";
  }

  async createContactSubmission(
    dto: CreateContactDto,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    // Save to Database
    const submission = await this.prisma.contactForm.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        message: dto.message,
        ipAddress: meta.ipAddress || null,
        userAgent: meta.userAgent || null,
        status: "PENDING",
      },
    });

    this.logger.log(
      `Saved contact form submission: ${submission.id}`,
      "ContactService",
    );

    // Fire and forget email notification
    this.mailService
      .sendContactFormNotification(this.adminEmail, {
        fullName: dto.fullName,
        email: dto.email,
        message: dto.message,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      })
      .catch((err) => {
        this.logger.error(
          `Failed to send contact notification for form ${submission.id}`,
          err,
          "ContactService",
        );
      });

    return {
      id: submission.id,
      status: submission.status,
      createdAt: submission.createdAt,
    };
  }
}
