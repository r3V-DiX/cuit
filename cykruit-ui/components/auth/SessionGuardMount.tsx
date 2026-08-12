"use client";

import { useSessionGuard } from "@/lib/use-session-guard";

/** Mounts useSessionGuard() from a Server Component layout (hooks need a client component). */
export function SessionGuardMount() {
  useSessionGuard();
  return null;
}
