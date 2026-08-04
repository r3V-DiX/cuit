// apps/subscription-service/src/subscription/services/subscription.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { SubscriptionStatusInput } from '../dto/assign.dto';
import { SubscriptionListQueryDto } from '../dto/query.dto';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { AuditService } from '@cykruit/audit';
import { AppLogger } from '@cykruit/logger';
import { EmployerLimitsService } from '@cykruit/subscription';

/** Minimum ms between auto-refresh writes to avoid write-on-every-read under load. */
const USAGE_REFRESH_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve the effective status, auto-detecting expiry.
 * EmployerSubscription.status may still read ACTIVE even after expiresAt passes
 * because there is no cron to flip it. We detect this at read time.
 */
/** Detect expiry at read time so status stays consistent across the system. */
export function resolveEffectiveStatus(status: string, expiresAt: Date | null): string {
    if (status === 'ACTIVE' && expiresAt && expiresAt <= new Date()) return 'EXPIRED';
    return status;
}

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly repo: SubscriptionRepository,
        private readonly payRepo: PaymentRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
        private readonly logger: AppLogger,
        private readonly employerLimitsService: EmployerLimitsService,
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
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        const sub = await this.repo.findSubscriptionById(id);
        if (!sub) throw new NotFoundException('Subscription not found');
        return { ...sub, effectiveStatus: resolveEffectiveStatus(sub.status, sub.expiresAt) };
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

    async cancelMySubscription(userId: string) {
        const employerId = await this.resolveEmployerId(userId);
        const sub = await this.repo.findSubscriptionByEmployer(employerId);
        if (!sub) throw new NotFoundException('No active subscription found');

        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt);
        if (effectiveStatus !== 'ACTIVE') {
            throw new BadRequestException(`Cannot cancel a subscription with status ${effectiveStatus}`);
        }

        const updated = await this.repo.updateSubscriptionStatus(sub.id, SubscriptionStatusInput.CANCELLED);

        // Invalidate cached limits — employer drops to Free tier immediately
        this.employerLimitsService.invalidate(employerId).catch((err: unknown) =>
            this.logger.warn(`Failed to invalidate employer limits cache: ${String(err)}`, 'SubscriptionService'),
        );

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'subscriptions:cancel',
            module: 'SUBSCRIPTIONS',
            targetType: 'EmployerSubscription',
            targetId: sub.id,
            oldData: { status: 'ACTIVE' },
            newData: { status: 'CANCELLED' },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        const ownerUserId = await this.repo.findOwnerUserIdForEmployer(employerId);
        if (ownerUserId) {
            this.eventPublisher.publish(
                DomainEventType.SUBSCRIPTION_CANCELLED,
                {
                    subscriptionId: sub.id,
                    employerId,
                    employerUserId: ownerUserId,
                    packageName: sub.package?.name ?? '',
                },
                'subscription-service',
            ).catch((err: unknown) =>
                this.logger.warn(`SUBSCRIPTION_CANCELLED publish failed: ${String(err)}`, 'SubscriptionService'),
            );
        }

        return updated;
    }

    async getMyUsage(userId: string) {
        const employerId = await this.resolveEmployerId(userId);
        const sub = await this.repo.findSubscriptionByEmployer(employerId);

        if (!sub) {
            const [freePkg, activeJobs, teamMembers, featuredJobs] = await Promise.all([
                this.payRepo.findFreePackage(),
                this.repo.countActiveJobs(employerId),
                this.repo.countTeamMembers(employerId),
                this.repo.countFeaturedJobs(employerId),
            ]);
            return {
                hasSubscription: false,
                limits: {
                    maxActiveJobs: freePkg?.maxActiveJobs ?? 0,
                    maxTeamMembers: freePkg?.maxTeamMembers ?? 0,
                    featuredJobSlots: freePkg?.featuredJobSlots ?? 0,
                    aiScoringEnabled: freePkg?.aiScoringEnabled ?? false,
                    jobPostingPeriodDays: freePkg?.jobPostingPeriodDays ?? 30,
                    resumeViewEnabled: freePkg?.resumeViewEnabled ?? false,
                    canExportApplicants: freePkg?.canExportApplicants ?? false,
                    analyticsEnabled: freePkg?.analyticsEnabled ?? false,
                    prioritySupportEnabled: freePkg?.prioritySupportEnabled ?? false,
                },
                usage: {
                    currentActiveJobs: activeJobs,
                    currentTeamMembers: teamMembers,
                    usedFeaturedJobSlots: featuredJobs,
                },
            };
        }

        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt);

        const staleSinceMs = Date.now() - sub.updatedAt.getTime();
        const source = staleSinceMs > USAGE_REFRESH_TTL_MS
            ? await this.repo.refreshUsage(employerId)
            : sub;

        // When subscription is not active (expired/cancelled), enforce Free-tier limits
        // so the UI doesn't show the old paid plan's limits as still available.
        const isActive = effectiveStatus === 'ACTIVE';
        const freePkg = !isActive ? await this.payRepo.findFreePackage() : null;
        const limits = freePkg ?? source.package;

        return {
            hasSubscription: true,
            effectiveStatus,
            expiresAt: source.expiresAt,
            packageName: isActive ? source.package.name : (freePkg?.name ?? 'Free'),
            limits: {
                maxActiveJobs: limits.maxActiveJobs,
                maxTeamMembers: limits.maxTeamMembers,
                featuredJobSlots: limits.featuredJobSlots,
                aiScoringEnabled: limits.aiScoringEnabled,
                jobPostingPeriodDays: limits.jobPostingPeriodDays,
                resumeViewEnabled: limits.resumeViewEnabled,
                canExportApplicants: limits.canExportApplicants,
                analyticsEnabled: limits.analyticsEnabled,
                prioritySupportEnabled: limits.prioritySupportEnabled,
            },
            usage: {
                currentActiveJobs: source.currentActiveJobs,
                currentTeamMembers: source.currentTeamMembers,
                usedFeaturedJobSlots: source.usedFeaturedJobSlots,
            },
        };
    }
}
