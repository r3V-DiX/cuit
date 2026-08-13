// apps/subscription-service/src/subscription/services/subscription.service.ts

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { SubscriptionListQueryDto } from '../dto/query.dto';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { AuditService } from '@cykruit/audit';
import { AppLogger } from '@cykruit/logger';
import { FREE_LIMITS } from '@cykruit/subscription';

/** Minimum ms between auto-refresh writes to avoid write-on-every-read under load. */
const USAGE_REFRESH_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resolve the display status, auto-detecting expiry and cancel-at-period-end.
 * EmployerSubscription.status may still read ACTIVE even after expiresAt passes
 * because there is no cron to flip it. We detect this at read time.
 *
 * A cancel-at-period-end plan keeps status ACTIVE (entitlement intact) but is
 * displayed as CANCELLED. Expiry always wins so an expired flagged plan reads EXPIRED.
 */
export function resolveEffectiveStatus(
    status: string,
    expiresAt: Date | null,
    cancelAtPeriodEnd = false,
): string {
    if (status === 'ACTIVE' && expiresAt && expiresAt <= new Date()) return 'EXPIRED';
    if (status === 'ACTIVE' && cancelAtPeriodEnd) return 'CANCELLED';
    return status;
}

/**
 * True when the employer is currently entitled to the plan's paid features.
 * This is the ONLY thing that drives limits. Cancellation (cancelAtPeriodEnd)
 * does NOT revoke entitlement — only a passed expiresAt (or a non-ACTIVE status
 * set by an admin) does.
 */
export function isSubscriptionEntitled(status: string, expiresAt: Date | null): boolean {
    return status === 'ACTIVE' && (expiresAt === null || expiresAt > new Date());
}

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly repo: SubscriptionRepository,
        private readonly payRepo: PaymentRepository,
        private readonly eventPublisher: EventPublisher,
        private readonly auditService: AuditService,
        private readonly logger: AppLogger,
    ) {}

    // ── Admin operations ──────────────────────────────────────────────────────

    async listAll(query: SubscriptionListQueryDto) {
        const { items, total } = await this.repo.findAllSubscriptions(query);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        return {
            items: items.map((s) => ({
                ...s,
                effectiveStatus: resolveEffectiveStatus(s.status, s.expiresAt, s.cancelAtPeriodEnd),
            })),
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        const sub = await this.repo.findSubscriptionById(id);
        if (!sub) throw new NotFoundException('Subscription not found');
        return { ...sub, effectiveStatus: resolveEffectiveStatus(sub.status, sub.expiresAt, sub.cancelAtPeriodEnd) };
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
        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt, sub.cancelAtPeriodEnd);
        return { hasSubscription: true, effectiveStatus, ...sub };
    }

    async cancelMySubscription(userId: string) {
        const employerId = await this.resolveEmployerId(userId);
        const sub = await this.repo.findSubscriptionByEmployer(employerId);
        if (!sub) throw new NotFoundException('No active subscription found');

        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt, sub.cancelAtPeriodEnd);
        if (effectiveStatus !== 'ACTIVE') {
            throw new BadRequestException(`Cannot cancel a subscription with status ${effectiveStatus}`);
        }

        // Cancel-at-period-end: status stays ACTIVE so the employer keeps their paid
        // entitlement until expiresAt. The flag only means "do not renew" — the hourly
        // expiry sweep flips this plan to EXPIRED when expiresAt passes.
        const updated = await this.repo.markCancelledAtPeriodEnd(sub.id);

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'subscriptions:cancel',
            module: 'SUBSCRIPTIONS',
            targetType: 'EmployerSubscription',
            targetId: sub.id,
            oldData: { status: 'ACTIVE', cancelAtPeriodEnd: false },
            newData: { status: 'ACTIVE', cancelAtPeriodEnd: true, cancelRequestedAt: new Date() },
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

    async resumeMySubscription(userId: string) {
        const employerId = await this.resolveEmployerId(userId);
        const sub = await this.repo.findSubscriptionByEmployer(employerId);
        if (!sub) throw new NotFoundException('No subscription found');
        if (!sub.cancelAtPeriodEnd) {
            throw new BadRequestException('Subscription is not cancelled');
        }

        const effectiveStatus = resolveEffectiveStatus(sub.status, sub.expiresAt, sub.cancelAtPeriodEnd);
        if (effectiveStatus !== 'CANCELLED') {
            throw new BadRequestException(`Cannot resume a subscription with status ${effectiveStatus}`);
        }

        const updated = await this.repo.resumeSubscription(sub.id);

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'subscriptions:resume',
            module: 'SUBSCRIPTIONS',
            targetType: 'EmployerSubscription',
            targetId: sub.id,
            oldData: { status: 'ACTIVE', cancelAtPeriodEnd: true },
            newData: { status: 'ACTIVE', cancelAtPeriodEnd: false },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        const ownerUserId = await this.repo.findOwnerUserIdForEmployer(employerId);
        if (ownerUserId) {
            this.eventPublisher.publish(
                DomainEventType.SUBSCRIPTION_RESUMED,
                {
                    subscriptionId: sub.id,
                    employerId,
                    employerUserId: ownerUserId,
                    packageName: sub.package?.name ?? '',
                    expiresAt: sub.expiresAt?.toISOString() ?? '',
                },
                'subscription-service',
            ).catch((err: unknown) =>
                this.logger.warn(`SUBSCRIPTION_RESUMED publish failed: ${String(err)}`, 'SubscriptionService'),
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

        const staleSinceMs = Date.now() - sub.updatedAt.getTime();
        const source = staleSinceMs > USAGE_REFRESH_TTL_MS
            ? await this.repo.refreshUsage(employerId)
            : sub;

        const effectiveStatus = resolveEffectiveStatus(source.status, source.expiresAt, source.cancelAtPeriodEnd);

        // Entitlement is driven by status + expiry only — a cancel-at-period-end plan
        // keeps its paid limits until expiresAt. Only expired/revoked plans fall back
        // to Free-tier limits so the UI never shows a dead plan's limits as available.
        const isActive = isSubscriptionEntitled(source.status, source.expiresAt);
        const freePkg = !isActive ? await this.payRepo.findFreePackage() : null;
        const limits = freePkg ?? FREE_LIMITS;

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
