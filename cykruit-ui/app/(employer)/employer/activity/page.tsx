"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Activity, Shield, Search, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, LogIn, LogOut, Key, AlertTriangle,
  CheckCircle2, XCircle, Clock, User, Monitor,
} from "lucide-react";
import { ActivityLogSkeleton, AuthLogSkeleton } from "@/components/ui/skeletons/ActivityLogSkeleton";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { KycGate } from "@/components/employer/KycGate";

type Tab = "system" | "auth";

interface SystemLog {
  id: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  riskLevel: string;
  result: string;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
  actor?: { id: string; email: string; firstName: string; lastName: string; role: string };
}

interface AuthLog {
  id: string;
  action: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { id: string; email: string; firstName: string; lastName: string };
}

interface Meta { total: number; page: number; limit: number; totalPages: number }

// ── Helpers ───────────────────────────────────────────────────

/** "JOB_MANAGEMENT" → "Job Management" */
function humanize(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const RISK_CFG: Record<string, { color: string; dot: string }> = {
  LOW:      { color: "text-green-700 bg-green-50 border-green-200",    dot: "bg-green-400"  },
  MEDIUM:   { color: "text-amber-700 bg-amber-50 border-amber-200",    dot: "bg-amber-400"  },
  HIGH:     { color: "text-orange-700 bg-orange-50 border-orange-200", dot: "bg-orange-400" },
  CRITICAL: { color: "text-rose-700 bg-rose-50 border-rose-200",       dot: "bg-rose-500"   },
};

const RESULT_CFG: Record<string, { color: string; icon: React.ReactNode }> = {
  SUCCESS: { color: "text-green-700 bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  FAILURE: { color: "text-rose-700 bg-rose-50 border-rose-200",    icon: <XCircle className="w-3 h-3" />     },
  BLOCKED: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: <AlertTriangle className="w-3 h-3" /> },
};

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

const MODULES = [
  { value: "", label: "All Modules" },
  { value: "JOB_MANAGEMENT",         label: "Job Management"         },
  { value: "APPLICATION_MANAGEMENT", label: "Application Management" },
  { value: "COMPANY",                label: "Company"                },
  { value: "TEAM",                   label: "Team"                   },
  { value: "SUBSCRIPTION",           label: "Subscription"           },
  { value: "KYC",                    label: "KYC"                    },
  { value: "SETTINGS",               label: "Settings"               },
];

const RISK_LEVELS = [
  { value: "", label: "All Risk" },
  { value: "LOW",      label: "Low"      },
  { value: "MEDIUM",   label: "Medium"   },
  { value: "HIGH",     label: "High"     },
  { value: "CRITICAL", label: "Critical" },
];

const RESULTS = [
  { value: "", label: "All Results" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILURE", label: "Failure" },
  { value: "BLOCKED", label: "Blocked" },
];

function Pagination({ meta, page, setPage }: { meta: Meta; page: number; setPage: (p: number) => void }) {
  return (
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
  );
}

export default function ActivityPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { toast }    = useToast();

  // ── Init from URL ─────────────────────────────────────────────
  const [tab,       setTabState]   = useState<Tab>((searchParams.get("tab") as Tab) || "system");
  const [sysSearch, setSysSearch]  = useState(searchParams.get("search") || "");
  const [sysModule, setSysModule]  = useState(searchParams.get("module") || "");
  const [sysRisk,   setSysRisk]    = useState(searchParams.get("risk")   || "");
  const [sysResult, setSysResult]  = useState(searchParams.get("result") || "");
  const [sysPage,   setSysPage]    = useState(Number(searchParams.get("page")) || 1);
  const [authSearch,setAuthSearch] = useState(searchParams.get("search") || "");
  const [authPage,  setAuthPage]   = useState(Number(searchParams.get("page")) || 1);

  const [sysLogs,    setSysLogs]    = useState<SystemLog[]>([]);
  const [sysMeta,    setSysMeta]    = useState<Meta | null>(null);
  const [sysLoading, setSysLoading] = useState(false);
  const [authLogs,   setAuthLogs]   = useState<AuthLog[]>([]);
  const [authMeta,   setAuthMeta]   = useState<Meta | null>(null);
  const [authLoading,setAuthLoading]= useState(false);

  // ── URL sync helper ───────────────────────────────────────────
  function pushUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function setTab(t: Tab) {
    setTabState(t);
    pushUrl({ tab: t, search: "", page: "", module: "", risk: "", result: "" });
    setSysSearch(""); setSysModule(""); setSysRisk(""); setSysResult(""); setSysPage(1);
    setAuthSearch(""); setAuthPage(1);
  }

  // ── Loaders ───────────────────────────────────────────────────
  const loadSystem = useCallback(async () => {
    setSysLoading(true);
    try {
      const params = new URLSearchParams({ page: String(sysPage), limit: "50" });
      if (sysSearch) params.set("search", sysSearch);
      if (sysModule) params.set("module", sysModule);
      if (sysRisk)   params.set("riskLevel", sysRisk);
      if (sysResult) params.set("result", sysResult);
      const { data } = await apiFetch(`/api/employer/activity/system?${params}`);
      const sysData = data as any;
      setSysLogs(sysData?.items ?? []);
      setSysMeta(sysData?.meta ?? null);
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to load system activity") });
    } finally { setSysLoading(false); }
  }, [sysPage, sysSearch, sysModule, sysRisk, sysResult, toast]);

  const loadAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const params = new URLSearchParams({ page: String(authPage), limit: "50" });
      if (authSearch) params.set("search", authSearch);
      const { data } = await apiFetch(`/api/employer/activity/auth?${params}`);
      const authData = data as any;
      setAuthLogs(authData?.items ?? []);
      setAuthMeta(authData?.meta ?? null);
    } catch (err: unknown) {
      toast({ type: "error", message: (err instanceof Error ? err.message : "Failed to load authentication activity") });
    } finally { setAuthLoading(false); }
  }, [authPage, authSearch, toast]);

  useEffect(() => { if (tab === "system") loadSystem(); }, [tab, loadSystem]);
  useEffect(() => { if (tab === "auth")   loadAuth();   }, [tab, loadAuth]);

  // ── Filter change handlers (update state + URL together) ──────
  function handleSysSearch(v: string) {
    setSysSearch(v); setSysPage(1);
    pushUrl({ search: v, page: "" });
  }
  function handleSysModule(v: string) {
    setSysModule(v); setSysPage(1);
    pushUrl({ module: v, page: "" });
  }
  function handleSysRisk(v: string) {
    setSysRisk(v); setSysPage(1);
    pushUrl({ risk: v, page: "" });
  }
  function handleSysResult(v: string) {
    setSysResult(v); setSysPage(1);
    pushUrl({ result: v, page: "" });
  }
  function handleSysPage(p: number) {
    setSysPage(p);
    pushUrl({ page: String(p) });
  }
  function handleAuthSearch(v: string) {
    setAuthSearch(v); setAuthPage(1);
    pushUrl({ search: v, page: "" });
  }
  function handleAuthPage(p: number) {
    setAuthPage(p);
    pushUrl({ page: String(p) });
  }

  return (
    <>
      <EmployerTopbar title="Activity" />
      <KycGate>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6">

          <div>
            <h1 className="text-xl font-bold text-slate-900">Organization Activity</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track all actions performed by your team members</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {([["system", Activity, "System Logs"], ["auth", Shield, "Auth Logs"]] as const).map(([t, Icon, label]) => (
              <button key={t} onClick={() => setTab(t as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ── System Logs ── */}
          {tab === "system" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={sysSearch} onChange={(e) => handleSysSearch(e.target.value)}
                    placeholder="Search action, module, actor…"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
                <select value={sysModule} onChange={(e) => handleSysModule(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer">
                  {MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={sysRisk} onChange={(e) => handleSysRisk(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer">
                  {RISK_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select value={sysResult} onChange={(e) => handleSysResult(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer">
                  {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button onClick={loadSystem}
                  className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 ${sysLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {sysLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actor</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <ActivityLogSkeleton count={8} />
                    </tbody>
                  </table>
                </div>
              ) : sysLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No system activity found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actor</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sysLogs.map((log) => {
                          const risk   = RISK_CFG[log.riskLevel]  ?? RISK_CFG.LOW;
                          const result = RESULT_CFG[log.result]   ?? RESULT_CFG.SUCCESS;
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3">
                                {log.actor ? (
                                  <div>
                                    <p className="font-medium text-slate-800 text-xs">{log.actor.firstName} {log.actor.lastName}</p>
                                    <p className="text-[11px] text-slate-400">{log.actor.email}</p>
                                  </div>
                                ) : <span className="text-xs text-slate-400">—</span>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono text-slate-700">{humanize(log.action)}</span>
                                {log.reason && <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-40">{log.reason}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-slate-600 font-medium">{humanize(log.module)}</span>
                                {log.targetType && <p className="text-[11px] text-slate-400">{humanize(log.targetType)}</p>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${risk.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                                  {humanize(log.riskLevel)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${result.color}`}>
                                  {result.icon} {humanize(log.result)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                                {formatDate(log.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {sysMeta && <Pagination meta={sysMeta} page={sysPage} setPage={handleSysPage} />}
                </>
              )}
            </div>
          )}

          {/* ── Auth Logs ── */}
          {tab === "auth" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={authSearch} onChange={(e) => handleAuthSearch(e.target.value)}
                    placeholder="Search email, action, IP…"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
                </div>
                <button onClick={loadAuth}
                  className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 ${authLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {authLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
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
              ) : authLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">No auth activity found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Device</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">IP</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {authLogs.map((log) => {
                          const ac = AUTH_ACTION_CFG[log.action] ?? { icon: <Clock className="w-3.5 h-3.5" />, color: "text-slate-500" };
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3">
                                {log.user ? (
                                  <div>
                                    <p className="font-medium text-slate-800 text-xs">{log.user.firstName} {log.user.lastName}</p>
                                    <p className="text-[11px] text-slate-400">{log.user.email}</p>
                                  </div>
                                ) : <span className="text-xs text-slate-400">Unknown</span>}
                              </td>
                              <td className="px-4 py-3">
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
                  {authMeta && <Pagination meta={authMeta} page={authPage} setPage={handleAuthPage} />}
                </>
              )}
            </div>
          )}

        </div>
      </div>
      </KycGate>
    </>
  );
}
