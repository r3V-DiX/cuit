// apps/seeker-profile-service/src/profile/controllers/resume.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
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
import { SkipRateLimit } from "@cykruit/rate-limit";
import { ResumeService } from "../services/resume.service";
import { DocumentFileValidator } from "../validators/file.validators";

@Controller("resumes")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get()
  @SkipRateLimit()
  getResumes(@CurrentUser() user: User) {
    return this.resumeService.getResumes(user.id);
  }

  @Get(":id")
  @SkipRateLimit()
  getResumeById(@CurrentUser() user: User, @Param("id") id: string) {
    return this.resumeService.getResumeById(user.id, id);
  }

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  uploadResume(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new DocumentFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.resumeService.uploadResume(user.id, file);
  }

  @Patch(":id")
  @UseInterceptors(FileInterceptor("file"))
  replaceResume(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new DocumentFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.resumeService.replaceResume(user.id, id, file);
  }

  @Delete(":id")
  deleteResume(@CurrentUser() user: User, @Param("id") id: string) {
    return this.resumeService.deleteResume(user.id, id);
  }
}
