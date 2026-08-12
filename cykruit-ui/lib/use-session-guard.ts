"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, logoutAndRedirect } from "@/lib/api";
import { useModal } from "@/components/ui/Modal";

const POLL_INTERVAL_MS = 60_000; // 60 seconds
const WARNING_LEAD_MS = 2 * 60_000; // show the popup 2 minutes before expiry

// setTimeout's delay is stored as a 32-bit signed int (max ~24.8 days) —
// a "remember me" session (30 days) exceeds that, causing the browser to
// fire the callback almost immediately instead of waiting. Chain shorter
// hops so a delay of any size waits for the real target time.
const MAX_TIMEOUT_MS = 2_147_000_000;

function scheduleAt(
  ref: { current: ReturnType<typeof setTimeout> | null },
  targetMs: number,
  callback: () => void,
) {
  const delay = targetMs - Date.now();
  if (delay > MAX_TIMEOUT_MS) {
    ref.current = setTimeout(() => scheduleAt(ref, targetMs, callback), MAX_TIMEOUT_MS);
    return;
  }
  ref.current = setTimeout(callback, Math.max(delay, 0));
}

/**
 * Polls /api/auth/me on tab focus and every 60s.
 * If the server returns 401 (session revoked from another device),
 * redirects to /login so the UI stays in sync with server state.
 *
 * Also schedules a "session expiring soon" popup off the server-reported
 * sessionExpiresAt, and auto-logs-out at the real expiry moment. Since the
 * backend transparently rotates the session token (and pushes expiresAt back
 * out) on every authenticated request, an active user re-triggers this via
 * the poll/focus checks and the warning is rescheduled forward — it only
 * actually fires when the user has gone idle long enough that no request
 * reached the server before the real expiry.
 */
export function useSessionGuard() {
  const router = useRouter();
  const { openModal } = useModal();
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearExpiryTimers() {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (expireTimer.current) clearTimeout(expireTimer.current);
  }

  function scheduleExpiryTimers(sessionExpiresAt: string | undefined) {
    clearExpiryTimers();
    if (!sessionExpiresAt) return;

    const msUntilExpiry = new Date(sessionExpiresAt).getTime() - Date.now();
    if (msUntilExpiry <= 0) return;

    const expiryMs = Date.now() + msUntilExpiry;
    const warningMs = expiryMs - WARNING_LEAD_MS;
    if (warningMs > Date.now()) {
      scheduleAt(warnTimer, warningMs, () => {
        openModal({
          variant: "info",
          title: "Session expiring soon",
          description: "You'll be signed out in about 2 minutes due to inactivity. Save any unsaved work.",
          confirmLabel: "OK",
          onConfirm: () => {},
        });
      });
    }

    scheduleAt(expireTimer, expiryMs, () => {
      logoutAndRedirect();
    });
  }

  async function check() {
    try {
      const { data } = await apiFetch<{ sessionExpiresAt?: string }>("/api/auth/me");
      scheduleExpiryTimers(data?.sessionExpiresAt);
    } catch (err: any) {
      if (err?.statusCode === 401) {
        router.replace("/login?reason=session_revoked");
      }
    }
  }

  useEffect(() => {
    function onFocus() { check(); }
    window.addEventListener("focus", onFocus);
    check();
    pollTimer.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      if (pollTimer.current) clearInterval(pollTimer.current);
      clearExpiryTimers();
    };
  }, []);
}
