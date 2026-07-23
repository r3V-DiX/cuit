// admin-app/src/modules/system-health/system-health.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { PrismaService } from '@cykruit/prisma';
import type Redis from 'ioredis';

const PING_TIMEOUT_MS = 2000;

type ServiceStatus = 'up' | 'down' | 'degraded';

interface ServiceHealth {
    name: string;
    url?: string;
    status: ServiceStatus;
    latencyMs: number | null;
}

interface DependencyHealth {
    status: 'up' | 'down';
}

export interface SystemHealth {
    services: ServiceHealth[];
    redis: DependencyHealth;
    db: DependencyHealth;
}

// Matches the *_SERVICE_URL convention already used by apps/gateway/src/main.ts's
// SERVICES map — same env var names, same http://<compose-service-name>:<port> shape
// under Docker Compose, localhost fallback for non-containerized dev.
const SERVICE_URLS: Record<string, { url: string; path: string }> = {
    'ai-service': { url: process.env.AI_SERVICE_URL || 'http://localhost:3005', path: '/health' },
    'auth-service': { url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001', path: '/health' },
    'user-settings-service': { url: process.env.SETTINGS_SERVICE_URL || 'http://localhost:4002', path: '/health' },
    'seeker-profile-service': { url: process.env.SEEKER_PROFILE_SERVICE_URL || 'http://localhost:4003', path: '/health' },
    'employer-service': { url: process.env.EMPLOYER_SERVICE_URL || 'http://localhost:4004', path: '/health' },
    'seeker-service': { url: process.env.SEEKER_SERVICE_URL || 'http://localhost:4005', path: '/health' },
    'public-service': { url: process.env.PUBLIC_SERVICE_URL || 'http://localhost:4006', path: '/health' },
    'notification-service': { url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007', path: '/health' },
    'subscription-service': { url: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:4008', path: '/health' },
    gateway: { url: process.env.GATEWAY_URL || 'http://localhost:5000', path: '/gateway/health' },
};

@Injectable()
export class SystemHealthService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(getRedisConnectionToken()) private readonly redis: Redis,
    ) {}

    async getHealth(): Promise<SystemHealth> {
        const isProduction = process.env.NODE_ENV === 'production';

        const [services, redis, db] = await Promise.all([
            Promise.all(
                Object.entries(SERVICE_URLS).map(([name, { url, path }]) =>
                    this.pingService(name, url, path, isProduction),
                ),
            ),
            this.checkRedis(),
            this.checkDb(),
        ]);

        return { services, redis, db };
    }

    private async pingService(
        name: string,
        baseUrl: string,
        path: string,
        maskUrl: boolean,
    ): Promise<ServiceHealth> {
        const started = Date.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

        try {
            const res = await fetch(`${baseUrl}${path}`, { signal: controller.signal });
            const latencyMs = Date.now() - started;
            return {
                name,
                ...(maskUrl ? {} : { url: baseUrl }),
                status: res.ok ? 'up' : 'degraded',
                latencyMs,
            };
        } catch {
            return {
                name,
                ...(maskUrl ? {} : { url: baseUrl }),
                status: 'down',
                latencyMs: null,
            };
        } finally {
            clearTimeout(timeout);
        }
    }

    private async checkDb(): Promise<DependencyHealth> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'up' };
        } catch {
            return { status: 'down' };
        }
    }

    private async checkRedis(): Promise<DependencyHealth> {
        try {
            await this.redis.ping();
            return { status: 'up' };
        } catch {
            return { status: 'down' };
        }
    }
}
