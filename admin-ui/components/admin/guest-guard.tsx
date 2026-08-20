'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * GuestGuard — prevents an already-authenticated admin from seeing /login.
 *
 * Mirrors cykruit-ui/components/GuestGuard.tsx: verified against the backend
 * via GET /api/admin/me (never by trusting the admin_session_token cookie),
 * so a stale/expired cookie just renders the login form instead of looping —
 * proxy.ts deliberately skips this check for the same reason (see its
 * isPublicPath comment).
 */
export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let authenticated = false;
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include' });
        authenticated = res.ok;
      } catch {
        // Network error — don't lock the user out; render the login page as normal.
      }
      if (cancelled) return;

      if (authenticated) {
        router.replace(searchParams.get('redirect') ?? '/dashboard');
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm">Checking your session…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
