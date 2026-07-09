'use client';

// admin-ui/app/(admin)/dashboard/page.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { DashboardStats } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import { Users, Briefcase, ShieldCheck, FileText, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get<DashboardStats>('/api/admin/dashboard');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <RequirePermission action={ACTIONS.DASHBOARD.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Platform Overview</h2>
          <p className="text-sm text-slate-500">Real-time statistics across all modules.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading || !stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Users"
              value={stats.users.total}
              icon={<Users className="h-5 w-5" />}
              accent="blue"
              note={`${stats.users.seekers} Seekers, ${stats.users.employers} Employers`}
            />
            <StatCard
              label="Active Jobs"
              value={stats.jobs.active}
              icon={<Briefcase className="h-5 w-5" />}
              accent="green"
              note={`${stats.jobs.pendingApproval} pending approval`}
            />
            <StatCard
              label="Pending KYC"
              value={stats.kyc.pendingReview}
              icon={<ShieldCheck className="h-5 w-5" />}
              accent={stats.kyc.pendingReview > 0 ? 'amber' : 'slate'}
              note="Awaiting admin review"
            />
            <StatCard
              label="Total Applications"
              value={stats.applications.total}
              icon={<FileText className="h-5 w-5" />}
              accent="slate"
              note="Across all jobs"
            />
            <StatCard
              label="Active Subscriptions"
              value={stats.subscriptions.active}
              icon={<CreditCard className="h-5 w-5" />}
              accent="blue"
              note="Employers with active plans"
            />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
