'use client';

// admin-ui/app/(admin)/subscriptions/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { EmployerSubscription } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sub, setSub] = useState<EmployerSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [id]);

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
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm p-6">
             <h3 className="font-semibold text-slate-900 mb-4">Subscription Info</h3>
             <pre className="text-sm bg-slate-50 p-4 rounded-lg">{JSON.stringify(sub, null, 2)}</pre>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
