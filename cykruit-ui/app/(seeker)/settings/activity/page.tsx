"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import {
  Shield, Search, ChevronLeft, ChevronRight,
  RefreshCw, LogIn, LogOut, Key, User,
  CheckCircle2, XCircle, Clock, Monitor, ArrowLeft,
} from "lucide-react";
import { AuthLogSkeleton } from "@/components/ui/skeletons/ActivityLogSkeleton";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface AuthLog {
  id: string;
  action: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface Meta { total: number; page: number; limit: number; totalPages: number }

function humanize(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const AUTH_ACTION_CFG: Record<string, { icon: React.ReactNode; color: string }> = {
  LOGIN:              { icon: <LogIn className="w-3.5 h-3.5" />,        color: "text-blue-600"   },
  LOGOUT:             { icon: <LogOut className="w-3.5 h-3.5" />,       color: "text-slate-500"  },
  REGISTER:           { icon: <User className="w-3.5 h-3.5" />,         color: "text-green-600"  },
  PASSWORD_CHANGE:    { icon: <Key className="w-3.5 h-3.5" />,          color: "text-violet-600" },
  PASSWORD_RESET:     { icon: <Key className="w-3.5 h-3.5" />,          color: "text-violet-600" },
  EMAIL_VERIFY:       { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-teal-600"   },
  SESSION_REVOKED:    { icon: <XCircle className="w-3.5 h-3.5" />,      color: "text-rose-600"   },
  TWO_FACTOR_ENABLED: { icon: <Shield className="w-3.5 h-3.5" />,       color: "text-blue-700"   },
};

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function authStatusCls(status: string) {
  if (status === "SUCCESS") return "text-green-700 bg-green-50 border-green-200";
  if (status === "FAILURE") return "text-rose-700 bg-rose-50 border-rose-200";
  return "text-amber-700 bg-amber-50 border-amber-200";
}

export default function SeekerActivityPage() {
  const { toast } = useToast();

  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [logs, setLogs]       = useState<AuthLog[]>([]);
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("search", search);
      const { data } = await apiFetch(`/api/seeker/activity/auth?${params}`);
      const d = data as any;
      setLogs(d?.items ?? []);
      setMeta(d?.meta ?? null);
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to load login history") });
    } finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(v: string) { setSearch(v); setPage(1); }

  return (
    <>
      <SeekerTopbar title="Login History" />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6">

          <div>
            <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Login History</h1>
            <p className="text-sm text-slate-500 mt-0.5">All sign-in activity and auth events on your account</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search action, IP…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
              </div>
              <button onClick={load}
                className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Device</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">IP</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AuthLogSkeleton count={8} />
                  </tbody>
                </table>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No login activity found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Device</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">IP</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.map((log) => {
                        const ac = AUTH_ACTION_CFG[log.action] ?? { icon: <Clock className="w-3.5 h-3.5" />, color: "text-slate-500" };
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3">
                              <span className={`flex items-center gap-1.5 text-xs font-medium ${ac.color}`}>
                                {ac.icon}
                                {humanize(log.action)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${authStatusCls(log.status)}`}>
                                {log.status === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {humanize(log.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-xs text-slate-600">
                                <Monitor className="w-3 h-3 text-slate-400" />
                                {log.userAgent ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.ipAddress ?? "—"}</td>
                            <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {meta && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">{meta.total} total · page {meta.page} of {meta.totalPages}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
