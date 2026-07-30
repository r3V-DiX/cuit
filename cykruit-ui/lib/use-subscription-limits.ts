'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from './api';

export interface SubscriptionLimits {
    maxActiveJobs: number;
    maxTeamMembers: number;
    featuredJobSlots: number;
    aiScoringEnabled: boolean;
    jobPostingPeriodDays: number;
    resumeViewEnabled: boolean;
    canExportApplicants: boolean;
    analyticsEnabled: boolean;
    prioritySupportEnabled: boolean;
}

export interface SubscriptionUsage {
    currentActiveJobs: number;
    currentTeamMembers: number;
    usedFeaturedJobSlots: number;
}

interface UsageResponse {
    hasSubscription: boolean;
    effectiveStatus?: string;
    packageName?: string;
    limits: SubscriptionLimits;
    usage: SubscriptionUsage;
}

interface UseSubscriptionLimitsResult {
    limits: SubscriptionLimits | null;
    usage: SubscriptionUsage | null;
    hasSubscription: boolean;
    loading: boolean;
    error: string | null;
}

const FREE_LIMITS: SubscriptionLimits = {
    maxActiveJobs: 1,
    maxTeamMembers: 2,
    featuredJobSlots: 0,
    aiScoringEnabled: false,
    jobPostingPeriodDays: 30,
    resumeViewEnabled: false,
    canExportApplicants: false,
    analyticsEnabled: false,
    prioritySupportEnabled: false,
};

const FREE_USAGE: SubscriptionUsage = {
    currentActiveJobs: 0,
    currentTeamMembers: 0,
    usedFeaturedJobSlots: 0,
};

export function useSubscriptionLimits(): UseSubscriptionLimitsResult {
    const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [hasSubscription, setHasSubscription] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        apiFetch<UsageResponse>('/api/subscriptions/usage')
            .then((res) => {
                if (cancelled) return;
                const data = res.data;
                setHasSubscription(data.hasSubscription);
                setLimits(data.limits ?? FREE_LIMITS);
                setUsage(data.usage ?? FREE_USAGE);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Failed to load subscription');
                setLimits(FREE_LIMITS);
                setUsage(FREE_USAGE);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { limits, usage, hasSubscription, loading, error };
}
