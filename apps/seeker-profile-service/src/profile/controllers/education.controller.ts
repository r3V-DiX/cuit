// apps/seeker-profile-service/src/profile/controllers/education.controller.ts

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
} from "@nestjs/common";
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
import { EducationService } from "../services/education.service";
import { CreateEducationDto } from "../dto/education/create-education.dto";
import { UpdateEducationDto } from "../dto/education/update-education.dto";
import { SearchInstitutesDto } from "../dto/education/search-institutes.dto";

@Controller("education")
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Get()
  @SkipRateLimit()
  getEducation(@CurrentUser() user: User) {
    return this.educationService.getEducation(user.id);
  }

  @Public()
  @Get("institutes/search")
  @SkipRateLimit()
  searchInstitutes(@Query() dto: SearchInstitutesDto) {
    return this.educationService.searchInstitutes(dto);
  }

  @Get(":id")
  @SkipRateLimit()
  getEducationById(@CurrentUser() user: User, @Param("id") id: string) {
    return this.educationService.getEducationById(user.id, id);
  }

  @Post()
  createEducation(@CurrentUser() user: User, @Body() dto: CreateEducationDto) {
    return this.educationService.createEducation(user.id, dto);
  }

  @Patch(":id")
  updateEducation(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.educationService.updateEducation(user.id, id, dto);
  }

  @Delete(":id")
  deleteEducation(@CurrentUser() user: User, @Param("id") id: string) {
    return this.educationService.deleteEducation(user.id, id);
  }
}
