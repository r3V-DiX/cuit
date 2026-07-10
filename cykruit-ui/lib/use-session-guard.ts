"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Polls /api/auth/me on tab focus and every 60s.
 * If the server returns 401 (session revoked from another device),
 * redirects to /login so the UI stays in sync with server state.
 */
export function useSessionGuard() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function check() {
    try {
      await apiFetch("/api/auth/me");
    } catch (err: any) {
      if (err?.statusCode === 401) {
        router.replace("/login?reason=session_revoked");
      }
    }
  }

  useEffect(() => {
    function onFocus() { check(); }
    window.addEventListener("focus", onFocus);
    timer.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);
}
