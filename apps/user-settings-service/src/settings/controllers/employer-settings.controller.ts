// apps/user-settings-service/src/settings/controllers/employer-settings.controller.ts
//
// Route prefix: /employer/settings  (employer only — guarded by RolesGuard)
//
// GET    /employer/settings                → full settings dump
// PATCH  /employer/settings/general        → update general preferences
// PATCH  /employer/settings/notifications  → update notification preferences

import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard, CurrentUser, Roles, RolesGuard } from "@cykruit/auth-core";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";

import { EmployerSettingsService } from "../services/employer-settings.service";
import { NotificationPreferenceService } from "../services/notification-preference.service";

import { UpdateEmployerGeneralDto } from "../dto/employer/update-employer-general.dto";
import { UpdateEmployerNotificationsDto } from "../dto/employer/update-employer-notifications.dto";

@Controller("employer/settings")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class EmployerSettingsController {
  constructor(
    private readonly employerSettingsService: EmployerSettingsService,
    private readonly notificationPrefService: NotificationPreferenceService,
  ) {}

  // ── GET /employer/settings ─────────────────────────────────────
  // Returns: { general, notifications }
  // Auto-creates missing sections with defaults — never 404
  @Get()
  @HttpCode(HttpStatus.OK)
  async getSettings(@CurrentUser() user: User) {
    return this.employerSettingsService.getFullSettings(user.id);
  }

  // ── PATCH /employer/settings/general ───────────────────────────
  // Partial update — send only the fields you want to change
  @Patch("general")
  @HttpCode(HttpStatus.OK)
  async updateGeneralSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateEmployerGeneralDto,
  ) {
    return this.employerSettingsService.updateGeneralSettings(user.id, dto);
  }

  // ── PATCH /employer/settings/notifications ─────────────────────
  // Partial update — send only the toggles you want to change
  @Patch("notifications")
  @HttpCode(HttpStatus.OK)
  async updateNotifications(
    @CurrentUser() user: User,
    @Body() dto: UpdateEmployerNotificationsDto,
  ) {
    return this.notificationPrefService.updateEmployerNotifications(
      user.id,
      dto,
    );
  }
}
