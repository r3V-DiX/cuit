// apps/seeker-profile-service/src/profile/controllers/ai-profile.controller.ts
import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { AuthGuard } from "@cykruit/auth-core";
import { RateLimit } from "@cykruit/rate-limit";
import { AIProfileService } from "../services/ai-profile.service";

@Controller("profile/ai")
@UseGuards(AuthGuard)
export class AIProfileController {
  constructor(private readonly aiProfileService: AIProfileService) {}

  @Post("parse-resume")
  @RateLimit({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor("file"))
  async parseResume(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    if (file.mimetype !== "application/pdf") {
      throw new BadRequestException("Only PDF files are supported");
    }

    // Pass the buffer directly to the service
    return this.aiProfileService.parseResumeAndApply(req.user.id, file.buffer);
  }

  @Get("generate-bio")
  @RateLimit({ default: { limit: 10, ttl: 60000 } })
  async generateBio(@Req() req: any) {
    return this.aiProfileService.generateBio(req.user.id);
  }

  @Get("suggest-skills")
  @RateLimit({ default: { limit: 10, ttl: 60000 } })
  async suggestSkills(@Req() req: any) {
    return this.aiProfileService.suggestSkills(req.user.id);
  }

  @Get("profile-tips")
  @RateLimit({ default: { limit: 10, ttl: 60000 } })
  async getProfileTips(@Req() req: any) {
    return this.aiProfileService.getProfileTips(req.user.id);
  }
}
