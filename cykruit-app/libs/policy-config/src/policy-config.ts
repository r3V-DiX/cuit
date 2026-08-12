// libs/policy-config/src/policy-config.ts
//
// Reads admin-editable PolicyConfig values (docs/ADMIN_TASKS.md TASK B7) from
// wherever they're needed — including plain decorator resolver functions that
// have no DI context (@nestjs/throttler's Resolvable<T> accepts a function).
// Owns its own lazy PrismaClient + ioredis singleton rather than going through
// Nest DI, since decorator-time code runs outside any module's injector.

import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const CACHE_TTL_S = 60;
const CACHE_PREFIX = "policy:";

let prisma: PrismaClient | null = null;
let redis: Redis | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function getRedis(): Redis {
  if (!redis) {
    const host = process.env.REDIS_HOST ?? "localhost";
    const port = process.env.REDIS_PORT ?? 6379;
    const password = process.env.REDIS_PASSWORD;
    const auth = password ? `:${encodeURIComponent(password)}@` : "";
    redis = new Redis(`redis://${auth}${host}:${port}`);
  }
  return redis;
}

/** Read a policy value, Redis-cached ~1min, falling back to `fallback` on cache miss with no DB row. */
export async function getPolicyValue(key: string, fallback: string): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  try {
    const cached = await getRedis().get(cacheKey);
    if (cached !== null) return cached;
  } catch {
    // Redis unavailable — fall through to DB read
  }

  let value = fallback;
  try {
    const row = await getPrisma().policyConfig.findUnique({ where: { key } });
    if (row) value = row.value;
  } catch {
    // DB unavailable — use fallback
  }

  try {
    await getRedis().set(cacheKey, value, "EX", CACHE_TTL_S);
  } catch {
    // Best-effort cache write
  }

  return value;
}

export async function getPolicyInt(key: string, fallback: number): Promise<number> {
  const raw = await getPolicyValue(key, String(fallback));
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Called by admin-app after an update/reset so consumers see the change immediately, not after the TTL. */
export async function invalidatePolicyCache(key: string): Promise<void> {
  try {
    await getRedis().del(`${CACHE_PREFIX}${key}`);
  } catch {
    // Best-effort — worst case, consumers see the stale value for up to CACHE_TTL_S
  }
}
