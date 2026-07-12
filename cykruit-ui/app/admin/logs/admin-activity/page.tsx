"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  ShieldAlert, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AdminLogEntry {
  id: string;
  action: string;
  module: string;
  actorId: string | null;
  targetType: string | null;
  targetId: string | null;
  riskLevel: string;
  result: string;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; email: string; firstName: string; lastName: string } | null;
}

interface PageMeta { total: number; page: number; limit: number; totalPages: number }

const RISK_COLOR: Record<string, string> = {
  LOW:      "text-slate-400 bg-slate-500/10 border-slate-500/20",
  MEDIUM:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  HIGH:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  CRITICAL: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const RESULT_COLOR: Record<string, string> = {
  SUCCESS: "text-emerald-400",
  FAILURE: "text-rose-400",
  DENIED:  "text-amber-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-slate-500 w-28 shrink-0">{label}</span>
      <span className={`text-slate-300 break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (search) params.set("search", search);
      if (riskFilter) params.set("riskLevel", riskFilter);
      if (resultFilter) params.set("result", resultFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const { data } = await apiFetch(`/api/admin/audit-logs/admin-activity?${params}`);
      setLogs(data?.items ?? []);
      setMeta(data?.meta ?? { total: 0, page: 1, limit: 50, totalPages: 1 });
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, riskFilter, resultFilter, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function clearFilters() {
    setSearch(""); setRiskFilter(""); setResultFilter(""); setFrom(""); setTo(""); setPage(1);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-violet-400" /> Admin Activity
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin console mutations — role changes, KYC decisions, subscription overrides
          </p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchLogs(); }}
        className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, action, module…"
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
            <option value="">All Risk</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
            <option value="">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="DENIED">Denied</option>
          </select>
          <input type="datetime-local" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" title="From" />
          <input type="datetime-local" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50" title="To" />
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
            <Filter className="w-4 h-4 inline mr-1.5" />Filter
          </button>
          <button type="button" onClick={clearFilters} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-sm transition-all">
            Clear
          </button>
        </div>
      </form>

      <div className="text-xs text-slate-500 font-mono">
        {meta.total.toLocaleString()} total events · page {meta.page} of {meta.totalPages}
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Loading logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No admin activity logs found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Action / Module</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
                <th className="text-left px-4 py-3 font-medium">Result</th>
                <th className="text-left px-4 py-3 font-medium">Actor</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
                <th className="text-left px-4 py-3 font-medium">IP</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-xs font-mono font-medium">{log.action}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">{log.module}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${RISK_COLOR[log.riskLevel] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
                        {log.riskLevel === "CRITICAL" && <ShieldAlert className="w-3 h-3" />}
                        {log.riskLevel === "HIGH" && <AlertTriangle className="w-3 h-3" />}
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${RESULT_COLOR[log.result] ?? "text-slate-400"}`}>
                        {log.result === "SUCCESS" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {log.result === "FAILURE" && <XCircle className="w-3.5 h-3.5" />}
                        {log.result === "DENIED" && <AlertTriangle className="w-3.5 h-3.5" />}
                        {log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <div>
                          <p className="text-slate-200 text-xs font-medium">{log.actor.firstName} {log.actor.lastName}</p>
                          <p className="text-slate-500 text-[11px] font-mono">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.targetType ? (
                        <div>
                          <p className="text-slate-400 text-[11px]">{log.targetType}</p>
                          {log.targetId && <p className="text-slate-600 text-[10px] font-mono truncate max-w-24">{log.targetId}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs font-mono">{log.ipAddress ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-xs" title={formatDate(log.createdAt)}>
                        {relTime(log.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {expanded === log.id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr key={`${log.id}-exp`} className="bg-[#0d1526]">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6 text-xs">
                          <div className="space-y-2">
                            <Row label="Log ID" value={log.id} mono />
                            <Row label="Actor ID" value={log.actorId ?? "—"} mono />
                            <Row label="IP Address" value={log.ipAddress ?? "—"} mono />
                            <Row label="Timestamp" value={formatDate(log.createdAt)} />
                          </div>
                          <div className="space-y-2">
                            <Row label="Target Type" value={log.targetType ?? "—"} />
                            <Row label="Target ID" value={log.targetId ?? "—"} mono />
                            <Row label="Reason" value={log.reason ?? "—"} />
                            <Row label="User Agent" value={log.userAgent ?? "—"} />
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div>
                                <p className="text-slate-500 mb-1">Metadata</p>
                                <pre className="text-slate-300 bg-black/30 rounded p-2 text-[10px] overflow-auto max-h-32 font-mono">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {((page - 1) * 50) + 1}–{Math.min(page * 50, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400 px-2 font-mono">{page} / {meta.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
