// apps/user-settings-service/src/settings/services/location-preference.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { LocationPreferenceRepository } from "../repositories/location-preference.repository";
import {
  AddLocationPreferenceDto,
  ReorderLocationPreferencesDto,
} from "../dto/seeker/location-preference.dto";

const MAX_LOCATIONS = 5;

@Injectable()
export class LocationPreferenceService {
  constructor(
    private readonly locationPrefRepo: LocationPreferenceRepository,
  ) {}

  async getAll(userId: string) {
    const preferences = await this.locationPrefRepo.findAllByUserId(userId);
    return {
      locations: preferences.map((p) => ({
        id: p.id,
        priority: p.priority,
        location: p.location,
        createdAt: p.createdAt,
      })),
      total: preferences.length,
      remaining: MAX_LOCATIONS - preferences.length,
    };
  }

  async add(userId: string, dto: AddLocationPreferenceDto) {
    // 1. Check max limit
    const currentCount = await this.locationPrefRepo.countByUserId(userId);
    if (currentCount >= MAX_LOCATIONS) {
      throw new BadRequestException({
        code: "LOCATION_LIMIT_REACHED",
        message: `You can add a maximum of ${MAX_LOCATIONS} preferred locations.`,
      });
    }

    // 2. Check location exists
    const locationExists = await this.locationPrefRepo.locationExists(
      dto.locationId,
    );
    if (!locationExists) {
      throw new NotFoundException({
        code: "LOCATION_NOT_FOUND",
        message: "The specified location does not exist.",
      });
    }

    // 3. Check not already added
    const existing = await this.locationPrefRepo.findOneByUserAndLocation(
      userId,
      dto.locationId,
    );
    if (existing) {
      throw new ConflictException({
        code: "LOCATION_ALREADY_ADDED",
        message: "This location is already in your preferences.",
      });
    }

    // 4. Assign next priority (append to end)
    const preference = await this.locationPrefRepo.create(
      userId,
      dto.locationId,
      currentCount, // 0-based priority
    );

    return {
      id: preference.id,
      priority: preference.priority,
      location: preference.location,
      createdAt: preference.createdAt,
    };
  }

  async remove(userId: string, preferenceId: string) {
    const preference = await this.locationPrefRepo.findOneById(
      preferenceId,
      userId,
    );
    if (!preference) {
      throw new NotFoundException({
        code: "LOCATION_PREFERENCE_NOT_FOUND",
        message: "Location preference not found.",
      });
    }

    await this.locationPrefRepo.delete(preferenceId);

    // Re-normalize priorities after deletion to close gaps
    const remaining = await this.locationPrefRepo.findAllByUserId(userId);
    if (remaining.length > 0) {
      const updates = remaining.map((p, index) => ({
        id: p.id,
        priority: index,
      }));
      await this.locationPrefRepo.bulkUpdatePriorities(updates);
    }

    return { message: "Location preference removed successfully." };
  }

  async reorder(userId: string, dto: ReorderLocationPreferencesDto) {
    // 1. Verify all IDs belong to this user
    const existing = await this.locationPrefRepo.findAllByUserId(userId);
    const existingIds = new Set(existing.map((p) => p.id));

    for (const item of dto.locations) {
      if (!existingIds.has(item.id)) {
        throw new BadRequestException({
          code: "INVALID_LOCATION_PREFERENCE_ID",
          message: `Location preference ${item.id} not found for this user.`,
        });
      }
    }

    // 2. Validate no duplicate priorities
    const priorities = dto.locations.map((l) => l.priority);
    const uniquePriorities = new Set(priorities);
    if (uniquePriorities.size !== priorities.length) {
      throw new BadRequestException({
        code: "DUPLICATE_PRIORITIES",
        message: "Each location must have a unique priority value.",
      });
    }

    // 3. Apply bulk update
    await this.locationPrefRepo.bulkUpdatePriorities(dto.locations);

    // 4. Return fresh sorted list
    return this.getAll(userId);
  }
}
