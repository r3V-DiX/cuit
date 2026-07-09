// admin-ui/components/ui/StatCard.tsx
// Single number stat card for the dashboard.

import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
  note?: string;
  href?: string;
}

const ACCENT_MAP: Record<string, { iconBg: string; iconColor: string; border: string }> = {
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    border: 'border-blue-100',
  },
  green: {
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    border: 'border-green-100',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
  },
  red: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    border: 'border-red-100',
  },
  slate: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    border: 'border-slate-200',
  },
};

export default function StatCard({
  label,
  value,
  icon,
  accent = 'blue',
  note,
}: StatCardProps) {
  const acc = ACCENT_MAP[accent];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${acc.iconBg} ${acc.border} ${acc.iconColor}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        {note && (
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{note}</p>
        )}
      </div>
    </div>
  );
}
