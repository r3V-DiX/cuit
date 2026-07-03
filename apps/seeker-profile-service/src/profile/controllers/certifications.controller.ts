// apps/seeker-profile-service/src/profile/controllers/certifications.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
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
  Public,
} from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { CertificationsService } from "../services/certifications.service";
import { AddCertificationDto } from "../dto/certifications/add-certification.dto";
import { UpdateCertificationDto } from "../dto/certifications/update-certification.dto";
import { SearchCertificationsDto } from "../dto/certifications/search-certifications.dto";

@Controller("certifications")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Get()
  @SkipRateLimit()
  getCertifications(@CurrentUser() user: User) {
    return this.certificationsService.getCertifications(user.id);
  }

  @Public()
  @Get("search")
  @SkipRateLimit()
  searchCertifications(@Query() dto: SearchCertificationsDto) {
    return this.certificationsService.searchCertifications(dto);
  }

  @Get(":id")
  @SkipRateLimit()
  getCertificationById(@CurrentUser() user: User, @Param("id") id: string) {
    return this.certificationsService.getCertificationById(user.id, id);
  }

  @Post()
  addCertification(
    @CurrentUser() user: User,
    @Body() dto: AddCertificationDto,
  ) {
    return this.certificationsService.addCertification(user.id, dto);
  }

  @Patch(":id")
  updateCertification(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.certificationsService.updateCertification(user.id, id, dto);
  }

  @Delete(":id")
  deleteCertification(@CurrentUser() user: User, @Param("id") id: string) {
    return this.certificationsService.deleteCertification(user.id, id);
  }

  @Patch(":id/certificate")
  @UseInterceptors(FileInterceptor("file"))
  uploadCertificateFile(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.certificationsService.uploadCertificateFile(user.id, id, file);
  }

  @Delete(":id/certificate")
  deleteCertificateFile(@CurrentUser() user: User, @Param("id") id: string) {
    return this.certificationsService.deleteCertificateFile(user.id, id);
  }
}
