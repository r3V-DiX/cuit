import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { InjectRedis } from "@nestjs-modules/ioredis";
import type Redis from "ioredis";
import { AnnouncementTarget, Prisma } from "@prisma/client";

const CACHE_TTL_S = 60;

const ANNOUNCEMENT_SELECT = {
  id: true,
  message: true,
  type: true,
  target: true,
  startsAt: true,
  expiresAt: true,
} satisfies Prisma.AnnouncementSelect;

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getActive(target?: AnnouncementTarget) {
    const cacheKey = `public:announcements:${target ?? "ALL"}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached !== null) return JSON.parse(cached);
    } catch {
      // Redis unavailable — fall through to DB read
    }

    const now = new Date();
    const result = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        target: target ? { in: [AnnouncementTarget.ALL, target] } : undefined,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        ],
      },
      select: ANNOUNCEMENT_SELECT,
      orderBy: { createdAt: "desc" },
    });

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL_S);
    } catch {
      // Best-effort cache write
    }

    return result;
  }
}
