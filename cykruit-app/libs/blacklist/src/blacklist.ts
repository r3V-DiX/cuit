// libs/blacklist/src/blacklist.ts
//
// Redis-cached check against the admin-managed Blacklist table
// (docs/ADMIN_TASKS.md TASK B9). Own lazy PrismaClient + ioredis singleton
// (not DI) so it's usable from any service without wiring a provider —
// mirrors libs/policy-config's shape.

import { PrismaClient, BlacklistType } from "@prisma/client";
import Redis from "ioredis";

const CACHE_TTL_S = 60;
const EMAILS_KEY = "blacklist:emails";
const DOMAINS_KEY = "blacklist:domains";

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

async function loadSets(): Promise<{ emails: Set<string>; domains: Set<string> }> {
  try {
    const [cachedEmails, cachedDomains] = await Promise.all([
      getRedis().get(EMAILS_KEY),
      getRedis().get(DOMAINS_KEY),
    ]);
    if (cachedEmails !== null && cachedDomains !== null) {
      return {
        emails: new Set(JSON.parse(cachedEmails) as string[]),
        domains: new Set(JSON.parse(cachedDomains) as string[]),
      };
    }
  } catch {
    // Redis unavailable — fall through to DB read
  }

  let rows: { value: string; type: BlacklistType }[] = [];
  try {
    rows = await getPrisma().blacklist.findMany({ select: { value: true, type: true } });
  } catch {
    // DB unavailable — treat as empty (fail open, never block signups on an outage)
  }

  const emails = rows.filter((r) => r.type === BlacklistType.EMAIL).map((r) => r.value.toLowerCase());
  const domains = rows.filter((r) => r.type === BlacklistType.DOMAIN).map((r) => r.value.toLowerCase());

  try {
    await Promise.all([
      getRedis().set(EMAILS_KEY, JSON.stringify(emails), "EX", CACHE_TTL_S),
      getRedis().set(DOMAINS_KEY, JSON.stringify(domains), "EX", CACHE_TTL_S),
    ]);
  } catch {
    // Best-effort cache write
  }

  return { emails: new Set(emails), domains: new Set(domains) };
}

/** Checks an email address against both the exact-email and domain blacklists. */
export async function isBlacklisted(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split("@")[1] ?? "";
  const { emails, domains } = await loadSets();
  return emails.has(normalized) || domains.has(domain);
}

/** Called by admin-app after add/delete so consumers see the change immediately, not after the TTL. */
export async function invalidateBlacklistCache(): Promise<void> {
  try {
    await Promise.all([getRedis().del(EMAILS_KEY), getRedis().del(DOMAINS_KEY)]);
  } catch {
    // Best-effort — worst case, consumers see the stale set for up to CACHE_TTL_S
  }
}
