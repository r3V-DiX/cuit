'use client';

// admin-ui/app/(admin)/subscriptions/[id]/page.tsx
import { useState, useEffect, useCallback, use } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { EmployerSubscription, PaymentOrder, PaginatedResponse, SubscriptionPackage } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { ArrowLeft, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import AssignSubscriptionForm from '../_components/assign-subscription-form';

function paise(n: number) {
  return '₹' + (n / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [sub, setSub] = useState<EmployerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingUsage, setRefreshingUsage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const canManage = has(ACTIONS.SUBSCRIPTIONS.MANAGE);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const effectiveStatus = sub?.effectiveStatus ?? sub?.status ?? null;
  const isFlagCancelled = sub?.cancelAtPeriodEnd === true;

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

  // Load payment orders once we know the employerId
  useEffect(() => {
    if (!sub?.employerId) return;
    setOrdersLoading(true);
    api.get<PaginatedResponse<PaymentOrder>>(
      `/api/admin/subscriptions/payment-orders?employerId=${sub.employerId}&limit=10`,
    )
      .then((res) => setOrders(res.items ?? []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [sub?.employerId]);

  const handleAction = (
    label: string,
    payload: { status: string; cancelAtPeriodEnd?: boolean },
    variant: 'success' | 'danger' = 'danger',
  ) => {
    if (!sub) return;
    openModal({
      title: label,
      description: `The subscription for "${sub.employer?.companyName ?? sub.employerId}" will be updated.`,
      variant,
      confirmLabel: label,
      onConfirm: async () => {
        try {
          await api.patch(`/api/admin/subscriptions/${id}/status`, payload);
          toast({ type: 'success', message: `${label} — subscription updated.` });
          refresh();
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update subscription' });
        }
      },
    });
  };

  const openChangePlan = async () => {
    if (!sub) return;
    try {
      const packages = await api.get<SubscriptionPackage[]>('/api/admin/subscriptions/packages');
      openModal({
        title: 'Change Plan',
        content: (
          <AssignSubscriptionForm
            packages={packages}
            employerId={sub.employerId}
            employerLabel={sub.employer?.companyName}
            onSaved={() => {
              closeModal();
              toast({ type: 'success', message: 'Subscription updated.' });
              refresh();
            }}
            onCancel={closeModal}
          />
        ),
      });
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load packages',
      });
    }
  };

  const handleRefreshUsage = async () => {
    if (!sub?.employerId) return;
    setRefreshingUsage(true);
    try {
      await api.post(`/api/admin/subscriptions/employer/${sub.employerId}/refresh-usage`, {});
      toast({ type: 'success', message: 'Usage counters refreshed.' });
      refresh();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to refresh usage' });
    } finally {
      setRefreshingUsage(false);
    }
  };

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  return (
    <RequirePermission action={ACTIONS.SUBSCRIPTIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/subscriptions/employers"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">Subscription Details</h2>
        </div>

        {loading || !sub ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : (
          <>
            {/* ── Main card ── */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-start justify-between gap-4">
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
                        {sub.billingCycle && (
                          <span className="ml-2 font-mono text-[10px] uppercase text-slate-400">
                            · {sub.billingCycle}
                          </span>
                        )}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={effectiveStatus ?? sub.status} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <button
                        onClick={openChangePlan}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Change Plan
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={handleRefreshUsage}
                        disabled={refreshingUsage}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                      >
                        {refreshingUsage
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />}
                        Refresh Usage
                      </button>
                    )}
                    {canManage && effectiveStatus === 'ACTIVE' && sub.expiresAt && (
                      <button
                        onClick={() =>
                          handleAction(
                            `Cancel (until ${format(new Date(sub.expiresAt!), 'MMM d')})`,
                            { status: 'ACTIVE', cancelAtPeriodEnd: true },
                          )
                        }
                        className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        Cancel (until {format(new Date(sub.expiresAt), 'MMM d')})
                      </button>
                    )}
                    {canManage && isFlagCancelled && (
                      <button
                        onClick={() => handleAction('Resume plan', { status: 'ACTIVE' }, 'success')}
                        className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        Resume plan
                      </button>
                    )}
                    {canManage && (effectiveStatus === 'ACTIVE' || isFlagCancelled) && (
                      <button
                        onClick={() => handleAction('Cancel immediately', { status: 'CANCELLED' })}
                        className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        Cancel immediately
                      </button>
                    )}
                    {canManage && effectiveStatus !== 'EXPIRED' && (
                      <button
                        onClick={() => handleAction('Mark expired', { status: 'EXPIRED' })}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Mark expired
                      </button>
                    )}
                    {canManage && (effectiveStatus === 'EXPIRED' || (effectiveStatus === 'CANCELLED' && !isFlagCancelled)) && (
                      <button
                        onClick={() => handleAction('Reactivate', { status: 'ACTIVE' }, 'success')}
                        className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isFlagCancelled && sub.expiresAt && (
                <div className="border-t border-amber-100 bg-amber-50 px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Plan cancelled — paid access continues until {format(new Date(sub.expiresAt), 'MMM d, yyyy')}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-600">
                        The employer keeps full plan features until this date, then drops to Free tier.
                        {sub.cancelRequestedAt && (
                          <> Cancellation requested {format(new Date(sub.cancelRequestedAt), 'MMM d, yyyy HH:mm')}.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  <p className="font-mono text-[10px] uppercase text-slate-500">Featured Slots</p>
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

            {/* ── Payment Orders ── */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Payment History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Razorpay orders placed by this employer.</p>
                </div>
                <Link
                  href={`/subscriptions/payments?employerId=${sub.employerId}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View all →
                </Link>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No payment orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Razorpay Order', 'Package', 'Cycle', 'Amount', 'GST', 'Total', 'Status', 'Date'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{o.razorpayOrderId}</td>
                          <td className="px-4 py-3 text-slate-700">{o.package?.name ?? o.packageId}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{o.billingCycle}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{paise(o.amountPaise)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{paise(o.gstAmountPaise)}</td>
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{paise(o.totalAmountPaise)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {format(new Date(o.createdAt), 'MMM d, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </RequirePermission>
  );
}
