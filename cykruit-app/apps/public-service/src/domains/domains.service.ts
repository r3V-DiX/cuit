import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { InjectRedis } from "@nestjs-modules/ioredis";
import type Redis from "ioredis";
import { Prisma } from "@prisma/client";

const CACHE_TTL_S = 600;
const CACHE_KEY = "public:domains";

const DOMAIN_SELECT = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.JobDomainSelect;

@Injectable()
export class DomainsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getActive() {
    try {
      const cached = await this.redis.get(CACHE_KEY);
      if (cached !== null) return JSON.parse(cached);
    } catch {
      // Redis unavailable — fall through to DB read
    }

    const result = await this.prisma.jobDomain.findMany({
      where: { isActive: true },
      select: DOMAIN_SELECT,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    try {
      await this.redis.set(CACHE_KEY, JSON.stringify(result), "EX", CACHE_TTL_S);
    } catch {
      // Best-effort cache write
    }

    return result;
  }
}
