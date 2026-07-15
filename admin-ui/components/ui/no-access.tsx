'use client';

// admin-ui/components/ui/NoAccess.tsx
// Full-page "You don't have access to this section" state.
// The shell (sidebar + topbar) stays visible — only the page content is replaced.

import { Lock } from 'lucide-react';
import Link from 'next/link';

export default function NoAccess() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <Lock className="h-7 w-7 text-slate-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Access restricted
        </h2>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          You don&apos;t have permission to view this section. Contact your
          administrator if you believe this is an error.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
