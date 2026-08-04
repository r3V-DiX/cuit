"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * GuestGuard — prevents already-authenticated users from seeing guest-only pages
 * (login, register, and anything that redirects to them).
 *
 * The session is verified against the backend via /api/auth/me (NOT by trusting
 * the session_token cookie), matching the pattern the callback page uses. This
 * deliberately avoids the infinite-redirect loop that a proxy-level cookie check
 * would cause when the cookie is stale/expired (see the note in proxy.ts):
 *   - invalid/expired session → /api/auth/me returns 401 → the guest page renders
 *   - valid session → redirect to the role's dashboard, never back to the guest page
 *
 * Redirect target mirrors the post-login routing in app/auth/callback/page.tsx:
 *   EMPLOYER → /kyc/employer if profile is missing / needs verification, else /employer/dashboard
 *   any other authenticated role → /dashboard
 */
export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let role: string | undefined;
      let needsKyc = false;
      try {
        const { data } = await apiFetch<{
          role?: string;
          employerStatus?: { hasProfile?: boolean; needsVerification?: boolean };
        }>("/api/auth/me", { skipAuthRedirect: true });
        role = data?.role;
        needsKyc =
          !data?.employerStatus?.hasProfile ||
          !!data?.employerStatus?.needsVerification;
      } catch {
        // Network error — don't lock the user out; render the guest page as normal.
      }
      if (cancelled) return;

      if (role === "EMPLOYER") {
        router.replace(needsKyc ? "/kyc/employer" : "/employer/dashboard");
        return;
      }
      if (role) {
        // SEEKER (or any other authenticated role) — authenticated, not an employer.
        router.replace("/dashboard");
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm">Checking your session…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
