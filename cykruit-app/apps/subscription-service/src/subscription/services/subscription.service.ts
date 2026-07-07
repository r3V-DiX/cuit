// apps/subscription-service/src/subscription/services/subscription.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { AssignSubscriptionDto, UpdateSubscriptionStatusDto } from '../dto/assign.dto';
import { SubscriptionListQueryDto } from '../dto/query.dto';
import { EventPublisher, DomainEventType } from '@cykruit/events';

/** Minimum ms between auto-refresh writes to avoid write-on-every-read under load. */
const USAGE_REFRESH_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve the effective status, auto-detecting expiry.
 * EmployerSubscription.status may still read ACTIVE even after expiresAt passes
 * because there is no cron to flip it. We detect this at read time.
 */
function resolveEffectiveStatus(status: string, expiresAt: Date | null): string {
    if (status === 'ACTIVE' && expiresAt && expiresAt < new Date()) return 'EXPIRED';
    return status;
}

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly repo: SubscriptionRepository,
        private readonly eventPublisher: EventPublisher,
    ) {}

    // ── Admin operations ──────────────────────────────────────────────────────

    async listAll(query: SubscriptionListQueryDto) {
        const { items, total } = await this.repo.findAllSubscriptions(query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        return {
            items: items.map((s) => ({
                ...s,
                effectiveStatus: resolveEffectiveStatus(s.status, s.expiresAt),
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        const sub = await this.repo.findSubscriptionById(id);
        if (!sub) throw new NotFoundException('Subscription not found');
        return { ...sub, effectiveStatus: resolveEffectiveStatus(sub.status, sub.expiresAt) };
    }

    async assign(dto: AssignSubscriptionDto) {
        const [employer, pkg] = await Promise.all([
            this.repo.findEmployerById(dto.employerId),
            this.repo.findPackageById(dto.packageId),
        ]);
        if (!employer) throw new NotFoundException(`Employer ${dto.employerId} not found`);
        if (!pkg) throw new NotFoundException(`Package ${dto.packageId} not found`);
        if (!pkg.isActive) throw new BadRequestException('Cannot assign an inactive package');

        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
        if (expiresAt && expiresAt < new Date()) {
            throw new BadRequestException('expiresAt must be in the future');
        }

        const result = await this.repo.assignSubscription(dto.employerId, dto.packageId, expiresAt);

        // Notify employer owner of new subscription (fire-and-forget)
        const ownerUserId = await this.repo.findOwnerUserIdForEmployer(dto.employerId);
        if (ownerUserId) {
            this.eventPublisher.publish(
                DomainEventType.SUBSCRIPTION_ASSIGNED,
                {
                    subscriptionId: result.id,
                    employerId: dto.employerId,
                    employerUserId: ownerUserId,
                    packageName: pkg.name,
                    expiresAt: expiresAt?.toISOString(),
                },
                'subscription-service',
            );
        }

        return result;
    }

    async updateStatus(id: string, dto: UpdateSubscriptionStatusDto) {
        const sub = await this.repo.findSubscriptionById(id);
        if (!sub) throw new NotFoundException('Subscription not found');

        const currentEffective = resolveEffectiveStatus(sub.status, sub.expiresAt);
        if (currentEffective === dto.status) {
            throw new BadRequestException(`Subscription is already ${dto.status}`);
        }

        // Only allow: ACTIVE→EXPIRED, ACTIVE→CANCELLED. Block EXPIRED/CANCELLED→ACTIVE
        // (re-activate must go through assign() so startedAt resets cleanly).
        if (dto.status === 'ACTIVE') {
            throw new BadRequestException(
                'Cannot reactivate a subscription directly. Use assign() to reassign a package.',
            );
        }

        return this.repo.updateSubscriptionStatus(id, dto.status);
    }

    async refreshUsage(employerId: string) {
        const sub = await this.repo.findSubscriptionByEmployer(employerId);
        if (!sub) throw new NotFoundException('No subscription found for this employer');
        return this.repo.refreshUsage(employerId);
    }

    // ── Employer-facing ───────────────────────────────────────────────────────

    private async resolveEmployerId(userId: string): Promise<string> {
        const employerId = await this.repo.resolveEmployerIdFromUser(userId);
        if (!employerId) throw new ForbiddenException('Employer account required');
        return employerId;
    }

    async getMySubscription(userId: string) {
        const employerId = await this.resolveEmployerId(userId);
        const sub = await this.repo.findSubscriptionByEmployer(employerId);
        if (!sub) return { hasSubscription: false };
        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt);
        return { hasSubscription: true, effectiveStatus, ...sub };
    }

    async getMyUsage(userId: string) {
        const employerId = await this.resolveEmployerId(userId);
        const sub = await this.repo.findSubscriptionByEmployer(employerId);

        if (!sub) {
            return {
                hasSubscription: false,
                limits: {
                    maxActiveJobs: 5,
                    maxTeamMembers: 3,
                    featuredJobSlots: 0,
                    aiScoringEnabled: false,
                },
                usage: {
                    currentActiveJobs: 0,
                    currentTeamMembers: 0,
                    usedFeaturedJobSlots: 0,
                },
            };
        }

        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt);

        // Only write-refresh if stale (> TTL since last update), preventing write-on-every-read
        const staleSinceMs = Date.now() - sub.updatedAt.getTime();
        const source = staleSinceMs > USAGE_REFRESH_TTL_MS
            ? await this.repo.refreshUsage(employerId)
            : sub;

        return {
            hasSubscription: true,
            effectiveStatus,
            expiresAt: source.expiresAt,
            packageName: source.package.name,
            limits: {
                maxActiveJobs: source.package.maxActiveJobs,
                maxTeamMembers: source.package.maxTeamMembers,
                featuredJobSlots: source.package.featuredJobSlots,
                aiScoringEnabled: source.package.aiScoringEnabled,
            },
            usage: {
                currentActiveJobs: source.currentActiveJobs,
                currentTeamMembers: source.currentTeamMembers,
                usedFeaturedJobSlots: source.usedFeaturedJobSlots,
            },
        };
    }
}
