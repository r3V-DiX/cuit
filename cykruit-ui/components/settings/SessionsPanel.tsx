"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Monitor, Smartphone, Tablet, Globe,
  Loader2, RefreshCw, LogOut, ShieldAlert, Clock, MapPin,
} from "lucide-react";
import { apiFetch, authHeaders, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  deviceType: "DESKTOP" | "MOBILE" | "TABLET" | "WEB" | "API";
  browserName: string;
  osName: string;
  deviceLabel: string;
  locationLabel: string;
  city: string | null;
  country: string | null;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  expiresAt: string | null;
  isCurrent: boolean;
  platform?: string | null;
  deviceName?: string | null;
}

interface HistoryEntry {
  id: string;
  deviceType: string;
  browserName: string;
  osName: string;
  deviceLabel: string;
  locationLabel: string;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
  isActive: boolean;
  revokedAt: string | null;
  revokedBy: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  const cls = className ?? "w-5 h-5";
  if (type === "MOBILE") return <Smartphone className={cls} />;
  if (type === "TABLET") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function revokeLabel(revokedBy: string | null): string {
  if (!revokedBy) return "Revoked";
  const map: Record<string, string> = {
    user_logout: "Signed out",
    logout_all: "Signed out (all devices)",
    user_revoke: "Revoked by you",
    user_revoke_all: "Revoked (sign out others)",
    expiry: "Expired",
    fingerprint_mismatch: "Security block",
    session_limit: "Session limit reached",
  };
  return map[revokedBy] ?? revokedBy;
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionsPanel({ onSignedOutAll }: { onSignedOutAll?: () => void }) {
  const { toast } = useToast();
  const { openModal } = useModal();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await apiFetch("/api/auth/sessions");
      const arr = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
      setSessions(Array.isArray(arr) ? arr : []);
    } catch {
      toast({ type: "error", message: "Could not load sessions" });
    } finally {
      setLoadingSessions(false);
    }
  }, [toast]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function loadHistory(page = 1) {
    setLoadingHistory(true);
    try {
      const res = await apiFetch<any>(`/api/auth/sessions/history?page=${page}&limit=10`);
      const arr = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
      setHistory(Array.isArray(arr) ? arr : []);
      setHistoryTotal(res?.total ?? res?.data?.total ?? 0);
      setHistoryPage(page);
    } catch {
      toast({ type: "error", message: "Could not load login history" });
    } finally {
      setLoadingHistory(false);
    }
  }

  async function revokeSession(s: Session) {
    openModal({
      variant: "danger",
      title: "Sign out this device?",
      description: `${s.deviceLabel} · ${s.locationLabel}`,
      confirmLabel: "Sign out",
      onConfirm: async () => {
        setRevokingId(s.id);
        try {
          await apiFetch(`/api/auth/sessions/${s.id}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          toast({ type: "success", message: "Device signed out" });
          setSessions((prev) => prev.filter((x) => x.id !== s.id));
        } catch (err: any) {
          toast({ type: "error", message: err instanceof ApiError ? err.message : "Failed to sign out device" });
        } finally {
          setRevokingId(null);
        }
      },
    });
  }

  async function revokeAllOthers() {
    openModal({
      variant: "danger",
      title: "Sign out all other devices?",
      description: "You will remain signed in on this device only.",
      confirmLabel: "Sign out others",
      onConfirm: async () => {
        setRevokingAll(true);
        try {
          const res = await apiFetch("/api/auth/sessions/others", {
            method: "DELETE",
            headers: authHeaders(),
          });
          toast({ type: "success", message: res.message ?? "Signed out of all other devices" });
          setSessions((prev) => prev.filter((s) => s.isCurrent));
          onSignedOutAll?.();
        } catch (err: any) {
          toast({ type: "error", message: err instanceof ApiError ? err.message : "Failed to sign out other devices" });
        } finally {
          setRevokingAll(false);
        }
      },
    });
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* ── Active sessions ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Active Sessions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Devices currently signed in to your account.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSessions}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {otherCount > 0 && (
              <button
                onClick={revokeAllOthers}
                disabled={revokingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                {revokingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                Sign out {otherCount} other{otherCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>

        {loadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No active sessions found.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                  s.isCurrent
                    ? "border-blue-200 bg-blue-50/60"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/60"
                }`}
              >
                {/* Device icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  s.isCurrent ? "bg-blue-100 text-blue-600" : "bg-white border border-slate-200 text-slate-500"
                }`}>
                  <DeviceIcon type={s.deviceType} className="w-4 h-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">{s.deviceLabel}</span>
                    {s.isCurrent && (
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md shrink-0">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {s.locationLabel && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {s.locationLabel}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 shrink-0" />
                      {timeAgo(s.lastActivity)}
                    </span>
                  </div>
                  {s.ipAddress && s.ipAddress !== "unknown" && (
                    <p className="text-[10px] text-slate-300 mt-0.5 font-mono">{s.ipAddress}</p>
                  )}
                </div>

                {/* Action */}
                {!s.isCurrent && (
                  <button
                    onClick={() => revokeSession(s)}
                    disabled={revokingId === s.id}
                    className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {revokingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign out"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Login history ─────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => {
            if (!showHistory) { loadHistory(1); }
            setShowHistory((v) => !v);
          }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ShieldAlert className="w-4 h-4 text-slate-400" />
          Login History
          <span className="text-[10px] font-mono text-slate-400 ml-1">{showHistory ? "▲" : "▼"}</span>
        </button>
        <p className="text-xs text-slate-400 mt-0.5 ml-6">All sign-in activity for your account.</p>

        {showHistory && (
          <div className="mt-3 space-y-1.5">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No history found.</div>
            ) : (
              <>
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      h.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <DeviceIcon type={h.deviceType} className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-700 truncate">{h.deviceLabel}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          h.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}>
                          {h.isActive ? "Active" : revokeLabel(h.revokedBy)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {h.locationLabel && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Globe className="w-2.5 h-2.5 shrink-0" />
                            {h.locationLabel}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          {new Date(h.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {historyTotal > 10 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-400">
                      Page {historyPage} · {historyTotal} total
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={historyPage <= 1}
                        onClick={() => loadHistory(historyPage - 1)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        disabled={historyPage * 10 >= historyTotal}
                        onClick={() => loadHistory(historyPage + 1)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
