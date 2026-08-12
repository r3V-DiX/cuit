'use client';

// admin-ui/components/auth/session-expiry-watcher.tsx
// Schedules a "session expiring soon" popup + auto-logout off the real
// sessionExpiresAt returned by GET /admin/me (via PermissionsProvider).
// Admin sessions have a fixed expiry (no rotation) — unlike cykruit-ui's
// equivalent, these timers are set once per sessionExpiresAt value and don't
// need rescheduling from a poll.

import { useEffect, useRef } from 'react';
import { useModal } from '@/components/ui/modal';
import { usePermissions } from '@/lib/permissions-context';
import { getCsrfToken } from '@/lib/api';

const WARNING_LEAD_MS = 2 * 60_000; // show the popup 2 minutes before expiry

// setTimeout's delay is stored as a 32-bit signed int (max ~24.8 days) —
// a "remember me" admin session (30 days) exceeds that, causing the browser
// to fire the callback almost immediately instead of waiting. Chain shorter
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

async function logoutAndRedirect() {
  try {
    const csrf = getCsrfToken();
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: csrf ? { 'x-csrf-token': csrf } : {},
    });
  } catch {
    // best-effort — redirect regardless
  }
  window.location.href = '/login';
}

export function SessionExpiryWatcher() {
  const { sessionExpiresAt } = usePermissions();
  const { openModal } = useModal();
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (expireTimer.current) clearTimeout(expireTimer.current);
    if (!sessionExpiresAt) return;

    const msUntilExpiry = new Date(sessionExpiresAt).getTime() - Date.now();
    if (msUntilExpiry <= 0) return;

    const expiryMs = Date.now() + msUntilExpiry;
    const warningMs = expiryMs - WARNING_LEAD_MS;
    if (warningMs > Date.now()) {
      scheduleAt(warnTimer, warningMs, () => {
        openModal({
          variant: 'info',
          title: 'Session expiring soon',
          description: "You'll be signed out in about 2 minutes. Save any unsaved work.",
          confirmLabel: 'OK',
          onConfirm: () => {},
        });
      });
    }

    scheduleAt(expireTimer, expiryMs, () => {
      logoutAndRedirect();
    });

    return () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (expireTimer.current) clearTimeout(expireTimer.current);
    };
  }, [sessionExpiresAt, openModal]);

  return null;
}
