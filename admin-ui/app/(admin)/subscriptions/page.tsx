'use client';

// admin-ui/app/(admin)/subscriptions/page.tsx
// One page, four tabs: Packages, Employer Subscriptions, Payment History,
// Discounts. /subscriptions/[id] stays a separate drill-down route (linked
// from these tabs), not merged in.
//
// `tab` is derived from the URL on every render (not just read once into
// local state) — Next.js reuses this same page instance for same-route
// navigations (e.g. a sidebar link changing only ?tab=), so a one-time
// useState initializer never picks up the change without a full reload.
// Switching tabs (buttons here, or links elsewhere) updates the URL via
// router.replace, which is what makes the switch actually show up.

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { NoAccess } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import PackagesTab from './_components/packages-tab';
import EmployerSubscriptionsTab from './_components/employer-subscriptions-tab';
import PaymentHistoryTab from './_components/payment-history-tab';
import DiscountsTab from './_components/discounts-tab';

type PageTab = 'packages' | 'employers' | 'payments' | 'discounts';

function isPageTab(value: string | null): value is PageTab {
  return value === 'packages' || value === 'employers' || value === 'payments' || value === 'discounts';
}

function SubscriptionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const employerId = searchParams.get('employerId') ?? undefined;

  const { has } = usePermissions();

  const hasSubscriptionsView = has(ACTIONS.SUBSCRIPTIONS.VIEW);
  const hasDiscountsView = has(ACTIONS.DISCOUNTS.VIEW);

  const availableTabs: { key: PageTab; label: string }[] = [
    ...(hasSubscriptionsView
      ? [
          { key: 'packages' as const, label: 'Packages' },
          { key: 'employers' as const, label: 'Employer Subscriptions' },
          { key: 'payments' as const, label: 'Payment History' },
        ]
      : []),
    ...(hasDiscountsView ? [{ key: 'discounts' as const, label: 'Discounts' }] : []),
  ];

  const rawTab = searchParams.get('tab');
  const tab = availableTabs.some((t) => t.key === rawTab) ? (rawTab as PageTab) : availableTabs[0]?.key;

  function setTab(key: PageTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  if (availableTabs.length === 0) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Subscriptions &amp; Discounts</h2>
        <p className="text-sm text-slate-500">
          Manage subscription packages, employer subscriptions, payments, and discount codes.
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {availableTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'employers' ? (
        <EmployerSubscriptionsTab />
      ) : tab === 'payments' ? (
        <PaymentHistoryTab initialEmployerId={employerId} />
      ) : tab === 'discounts' ? (
        <DiscountsTab />
      ) : (
        <PackagesTab />
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <SubscriptionsPageContent />
    </Suspense>
  );
}
