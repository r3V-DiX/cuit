'use client';

// admin-ui/app/(admin)/subscriptions/page.tsx
// One page, three tabs: Packages, Employer Subscriptions, Discounts.
// /subscriptions/payments and /subscriptions/[id] stay separate drill-down
// routes (linked from these tabs), not merged in.

import { useState } from 'react';
import { ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import { NoAccess } from '@/components/ui';
import PackagesTab from './_components/packages-tab';
import EmployerSubscriptionsTab from './_components/employer-subscriptions-tab';
import DiscountsTab from './_components/discounts-tab';

type PageTab = 'packages' | 'employers' | 'discounts';

export default function SubscriptionsPage() {
  const { has } = usePermissions();
  const [tabState, setTab] = useState<PageTab>('packages');

  const hasSubscriptionsView = has(ACTIONS.SUBSCRIPTIONS.VIEW);
  const hasDiscountsView = has(ACTIONS.DISCOUNTS.VIEW);

  const availableTabs: { key: PageTab; label: string }[] = [
    ...(hasSubscriptionsView
      ? [
          { key: 'packages' as const, label: 'Packages' },
          { key: 'employers' as const, label: 'Employer Subscriptions' },
        ]
      : []),
    ...(hasDiscountsView ? [{ key: 'discounts' as const, label: 'Discounts' }] : []),
  ];
  const tab = availableTabs.some((t) => t.key === tabState) ? tabState : availableTabs[0]?.key;

  if (availableTabs.length === 0) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Subscriptions &amp; Discounts</h2>
        <p className="text-sm text-slate-500">
          Manage subscription packages, employer subscriptions, and discount codes.
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
      ) : tab === 'discounts' ? (
        <DiscountsTab />
      ) : (
        <PackagesTab />
      )}
    </div>
  );
}
