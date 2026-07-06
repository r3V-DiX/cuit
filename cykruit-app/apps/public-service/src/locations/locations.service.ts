import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchLocations(q: string) {
    return this.prisma.location.findMany({
      where: {
        searchText: {
          contains: q.toLowerCase(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        displayName: true,
        city: true,
        state: true,
        country: true,
      },
      take: 10,
    });
  }

  async getPopularLocations() {
    return this.prisma.location.findMany({
      where: {
        isPopular: true,
      },
      select: {
        id: true,
        displayName: true,
        city: true,
        state: true,
        country: true,
      },
      orderBy: {
        usageCount: "desc",
      },
      take: 10,
    });
  }
}
