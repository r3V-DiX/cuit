'use client';

// admin-ui/app/(admin)/subscriptions/[id]/page.tsx
import { useState, useEffect, useCallback, use } from 'react';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import { usePermissions } from '@/lib/permissions-context';
import type { EmployerSubscription } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Skeleton from '@/components/ui/Skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { has } = usePermissions();
  const { openModal } = useModal();
  const { toast } = useToast();

  const [sub, setSub] = useState<EmployerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const canManage = has(ACTIONS.SUBSCRIPTIONS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadSub() {
      try {
        const data = await api.get<EmployerSubscription>(`/api/admin/subscriptions/${id}`);
        setSub(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    }
    loadSub();
  }, [id, reloadKey]);

  const handleStatusChange = (newStatus: string) => {
    if (!sub) return;
    openModal({
      title: `Set status to ${newStatus}?`,
      description: `The subscription for "${sub.employer?.companyName ?? sub.employerId}" will be marked ${newStatus}.`,
      variant: newStatus === 'ACTIVE' ? 'success' : 'danger',
      confirmLabel: `Set ${newStatus}`,
      onConfirm: async () => {
        try {
          await api.patch(`/api/admin/subscriptions/${id}/status`, { status: newStatus });
          toast({ type: 'success', message: `Subscription marked ${newStatus}.` });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to update status',
          });
        }
      },
    });
  };

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/subscriptions"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Subscription Details
            </h2>
          </div>
        </div>

        {loading || !sub ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <CreditCard className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {sub.employer?.companyName ?? sub.employerId}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {sub.package?.name ?? sub.packageId}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    {STATUSES.filter((s) => s !== sub.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Set {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6 lg:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Started</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {format(new Date(sub.startedAt), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Expires</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {sub.expiresAt ? format(new Date(sub.expiresAt), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Jobs Usage</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {sub.currentActiveJobs} / {sub.package?.maxActiveJobs ?? '∞'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Team Members</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {sub.currentTeamMembers} / {sub.package?.maxTeamMembers ?? '∞'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Featured Slots Used</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {sub.usedFeaturedJobSlots} / {sub.package?.featuredJobSlots ?? '∞'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">AI Scoring</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {sub.package?.aiScoringEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Employer ID</p>
                <p className="mt-1 font-mono text-xs text-slate-600">{sub.employerId}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase text-slate-500">Last Updated</p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {format(new Date(sub.updatedAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
