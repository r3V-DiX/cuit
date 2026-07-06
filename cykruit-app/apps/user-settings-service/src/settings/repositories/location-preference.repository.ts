// apps/user-settings-service/src/settings/repositories/location-preference.repository.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { LocationPreference } from "@prisma/client";

export type LocationPreferenceWithLocation = LocationPreference & {
  location: {
    id: string;
    city: string;
    state: string | null;
    country: string;
    displayName: string;
  };
};

@Injectable()
export class LocationPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(
    userId: string,
  ): Promise<LocationPreferenceWithLocation[]> {
    return this.prisma.locationPreference.findMany({
      where: { userId },
      include: {
        location: {
          select: {
            id: true,
            city: true,
            state: true,
            country: true,
            displayName: true,
          },
        },
      },
      orderBy: { priority: "asc" },
    }) as Promise<LocationPreferenceWithLocation[]>;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.locationPreference.count({ where: { userId } });
  }

  async findOneByUserAndLocation(
    userId: string,
    locationId: string,
  ): Promise<LocationPreference | null> {
    return this.prisma.locationPreference.findUnique({
      where: { userId_locationId: { userId, locationId } },
    });
  }

  async findOneById(
    id: string,
    userId: string,
  ): Promise<LocationPreference | null> {
    return this.prisma.locationPreference.findFirst({
      where: { id, userId },
    });
  }

  async create(
    userId: string,
    locationId: string,
    priority: number,
  ): Promise<LocationPreferenceWithLocation> {
    return this.prisma.locationPreference.create({
      data: { userId, locationId, priority },
      include: {
        location: {
          select: {
            id: true,
            city: true,
            state: true,
            country: true,
            displayName: true,
          },
        },
      },
    }) as Promise<LocationPreferenceWithLocation>;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.locationPreference.delete({ where: { id } });
  }

  // Bulk update priorities — used for reorder operation
  async bulkUpdatePriorities(
    updates: { id: string; priority: number }[],
  ): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, priority }) =>
        this.prisma.locationPreference.update({
          where: { id },
          data: { priority },
        }),
      ),
    );
  }

  async locationExists(locationId: string): Promise<boolean> {
    const loc = await this.prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });
    return !!loc;
  }
}
