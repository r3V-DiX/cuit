// apps/user-settings-service/src/settings/controllers/seeker-settings.controller.ts
//
// Route prefix: /settings  (seeker only — guarded by RolesGuard)
//
// GET    /settings                   → full settings dump
// PATCH  /settings/general           → update general preferences
// PATCH  /settings/notifications     → update notification preferences
// GET    /settings/locations         → get preferred locations
// POST   /settings/locations         → add a location (max 5)
// DELETE /settings/locations/:id     → remove a location
// PATCH  /settings/locations/reorder → reorder priorities

import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard, CurrentUser, Roles, RolesGuard } from "@cykruit/auth-core";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";

import { SeekerSettingsService } from "../services/seeker-settings.service";
import { NotificationPreferenceService } from "../services/notification-preference.service";
import { LocationPreferenceService } from "../services/location-preference.service";

import { UpdateSeekerGeneralDto } from "../dto/seeker/update-seeker-general.dto";
import { UpdateSeekerNotificationsDto } from "../dto/seeker/update-seeker-notifications.dto";
import {
  AddLocationPreferenceDto,
  ReorderLocationPreferencesDto,
} from "../dto/seeker/location-preference.dto";

@Controller("settings")
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SEEKER)
export class SeekerSettingsController {
  constructor(
    private readonly seekerSettingsService: SeekerSettingsService,
    private readonly notificationPrefService: NotificationPreferenceService,
    private readonly locationPrefService: LocationPreferenceService,
  ) {}

  // ── GET /settings ──────────────────────────────────────────────
  // Returns: { general, notifications, locations }
  // Auto-creates missing sections with defaults — never 404
  @Get()
  @HttpCode(HttpStatus.OK)
  async getSettings(@CurrentUser() user: User) {
    return this.seekerSettingsService.getFullSettings(user.id);
  }

  // ── PATCH /settings/general ────────────────────────────────────
  // Partial update — send only the fields you want to change
  @Patch("general")
  @HttpCode(HttpStatus.OK)
  async updateGeneralSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateSeekerGeneralDto,
  ) {
    return this.seekerSettingsService.updateGeneralSettings(user.id, dto);
  }

  // ── PATCH /settings/notifications ──────────────────────────────
  // Partial update — send only the toggles you want to change
  @Patch("notifications")
  @HttpCode(HttpStatus.OK)
  async updateNotifications(
    @CurrentUser() user: User,
    @Body() dto: UpdateSeekerNotificationsDto,
  ) {
    return this.notificationPrefService.updateSeekerNotifications(user.id, dto);
  }

  // ── GET /settings/locations ────────────────────────────────────
  // Returns sorted list of preferred locations + remaining slots
  @Get("locations")
  @HttpCode(HttpStatus.OK)
  async getLocations(@CurrentUser() user: User) {
    return this.locationPrefService.getAll(user.id);
  }

  // ── POST /settings/locations ───────────────────────────────────
  // Add a preferred location (max 5)
  @Post("locations")
  @HttpCode(HttpStatus.CREATED)
  async addLocation(
    @CurrentUser() user: User,
    @Body() dto: AddLocationPreferenceDto,
  ) {
    return this.locationPrefService.add(user.id, dto);
  }

  // ── DELETE /settings/locations/:id ─────────────────────────────
  // Remove a preferred location by preference ID
  @Delete("locations/:id")
  @HttpCode(HttpStatus.OK)
  async removeLocation(
    @CurrentUser() user: User,
    @Param("id") preferenceId: string,
  ) {
    return this.locationPrefService.remove(user.id, preferenceId);
  }

  // ── PATCH /settings/locations/reorder ──────────────────────────
  // Reorder location priorities — send full array with new priorities
  // NOTE: Must be defined BEFORE /locations/:id to avoid route conflict
  @Patch("locations/reorder")
  @HttpCode(HttpStatus.OK)
  async reorderLocations(
    @CurrentUser() user: User,
    @Body() dto: ReorderLocationPreferencesDto,
  ) {
    return this.locationPrefService.reorder(user.id, dto);
  }
}
