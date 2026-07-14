// apps/seeker-profile-service/src/profile/controllers/ai-profile.controller.ts
import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";
import {
  AuthGuard,
  RolesGuard,
  CsrfGuard,
  Roles,
  CurrentUser,
} from "@cykruit/auth-core";
import { RateLimit } from "@cykruit/rate-limit";
import { AIProfileService } from "../services/ai-profile.service";

@Controller("profile/ai")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class AIProfileController {
  constructor(private readonly aiProfileService: AIProfileService) {}

  @Post("parse-resume")
  @RateLimit({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor("file"))
  async parseResume(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException("Only PDF files are supported");
    }
    return this.aiProfileService.parseResumeAndApply(user.id, file.buffer);
  }

  @Get("generate-bio")
  @RateLimit({ default: { limit: 10, ttl: 60000 } })
  generateBio(@CurrentUser() user: User) {
    return this.aiProfileService.generateBio(user.id);
  }

  @Get("suggest-skills")
  @RateLimit({ default: { limit: 10, ttl: 60000 } })
  suggestSkills(@CurrentUser() user: User) {
    return this.aiProfileService.suggestSkills(user.id);
  }

  @Get("profile-tips")
  @RateLimit({ default: { limit: 10, ttl: 60000 } })
  getProfileTips(@CurrentUser() user: User) {
    return this.aiProfileService.getProfileTips(user.id);
  }
}
