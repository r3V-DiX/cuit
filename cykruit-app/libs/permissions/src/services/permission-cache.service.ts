// libs/permissions/src/services/permission-cache.service.ts
// Redis cache for permission resolution. TTL = 5 min per user.
// Invalidated on: role assignment change, permission override change.

import { Injectable, Inject, Optional } from '@nestjs/common';

const CACHE_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class PermissionCacheService {
    // Redis client is optional — if not provided, caching is a no-op (unit tests / local dev without Redis)
    constructor(
        @Optional() @Inject('REDIS_CLIENT') private readonly redis: any,
    ) {}

    private userKey(userId: string, employerId?: string): string {
        return employerId
            ? `perm:${userId}:${employerId}`
            : `perm:${userId}`;
    }

    async get(userId: string, employerId?: string): Promise<Set<string> | null> {
        if (!this.redis) return null;
        try {
            const raw = await this.redis.get(this.userKey(userId, employerId));
            if (!raw) return null;
            return new Set<string>(JSON.parse(raw));
        } catch {
            return null;
        }
    }

    async set(userId: string, permissions: Set<string>, employerId?: string): Promise<void> {
        if (!this.redis) return;
        try {
            await this.redis.setex(
                this.userKey(userId, employerId),
                CACHE_TTL_SECONDS,
                JSON.stringify([...permissions]),
            );
        } catch {
            // Cache write failure is non-fatal — permissions will re-resolve from DB
        }
    }

    async invalidate(userId: string, employerId?: string): Promise<void> {
        if (!this.redis) return;
        try {
            if (employerId) {
                // Invalidate both global and company-scoped cache
                await this.redis.del(this.userKey(userId, employerId));
            }
            await this.redis.del(this.userKey(userId));
        } catch {
            // Ignore
        }
    }

    async invalidateAllForEmployer(employerId: string): Promise<void> {
        if (!this.redis) return;
        try {
            // Scan for all keys matching perm:*:employerId
            const pattern = `perm:*:${employerId}`;
            let cursor = '0';
            do {
                const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = next;
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            } while (cursor !== '0');
        } catch {
            // Ignore
        }
    }
}
