"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Shield, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Clock, LogIn, LogOut,
  Key, Mail, User, Smartphone, Filter,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AuthLogUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthLogEntry {
  id: string;
  action: string;
  status: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuthLogUser | null;
}

interface PageMeta { total: number; page: number; limit: number; totalPages: number }

const ACTION_ICON: Record<string, React.ReactNode> = {
  LOGIN_SUCCESS: <LogIn className="w-3.5 h-3.5" />,
  LOGIN_FAILURE: <XCircle className="w-3.5 h-3.5" />,
  LOGIN_LOCKED: <AlertTriangle className="w-3.5 h-3.5" />,
  LOGOUT: <LogOut className="w-3.5 h-3.5" />,
  LOGOUT_ALL: <LogOut className="w-3.5 h-3.5" />,
  REGISTER: <User className="w-3.5 h-3.5" />,
  EMAIL_VERIFIED: <Mail className="w-3.5 h-3.5" />,
  EMAIL_VERIFICATION_RESENT: <Mail className="w-3.5 h-3.5" />,
  PASSWORD_CHANGED: <Key className="w-3.5 h-3.5" />,
  PASSWORD_RESET_REQUESTED: <Key className="w-3.5 h-3.5" />,
  PASSWORD_RESET_COMPLETED: <Key className="w-3.5 h-3.5" />,
  SESSION_REVOKED: <Shield className="w-3.5 h-3.5" />,
  SESSION_REVOKED_ALL: <Shield className="w-3.5 h-3.5" />,
  OAUTH_LOGIN: <LogIn className="w-3.5 h-3.5" />,
  MOBILE_LOGIN: <Smartphone className="w-3.5 h-3.5" />,
};

const ACTION_COLOR: Record<string, string> = {
  LOGIN_SUCCESS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  LOGIN_FAILURE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  LOGIN_LOCKED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  LOGOUT: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  LOGOUT_ALL: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  REGISTER: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  EMAIL_VERIFIED: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  EMAIL_VERIFICATION_RESENT: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  PASSWORD_CHANGED: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  PASSWORD_RESET_REQUESTED: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  PASSWORD_RESET_COMPLETED: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  SESSION_REVOKED: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  SESSION_REVOKED_ALL: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  OAUTH_LOGIN: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  MOBILE_LOGIN: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });
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

const ALL_ACTIONS = [
  "LOGIN_SUCCESS","LOGIN_FAILURE","LOGIN_LOCKED","LOGOUT","LOGOUT_ALL",
  "REGISTER","EMAIL_VERIFIED","EMAIL_VERIFICATION_RESENT",
  "PASSWORD_CHANGED","PASSWORD_RESET_REQUESTED","PASSWORD_RESET_COMPLETED",
  "SESSION_REVOKED","SESSION_REVOKED_ALL","SESSION_ROTATED","SESSION_EXPIRED",
  "OAUTH_LOGIN","OAUTH_ACCOUNT_LINKED","ACCOUNT_DELETED","ACCOUNT_DEACTIVATED",
  "ACCOUNT_DELETION_CANCELLED","MOBILE_LOGIN","MOBILE_TOKEN_REFRESHED","MOBILE_LOGOUT",
];

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-slate-500 w-28 shrink-0">{label}</span>
      <span className={`text-slate-300 break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function AuthLogsPage() {
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
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
      if (statusFilter) params.set("status", statusFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const json = await apiFetch(`/api/admin/audit-logs/auth?${params}`);
      const data = json?.data ?? json;
      setLogs(data?.items ?? []);
      setMeta(data?.meta ?? { total: 0, page: 1, limit: 50, totalPages: 1 });
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, actionFilter, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  }

  function clearFilters() {
    setSearch(""); setStatusFilter(""); setActionFilter(""); setFrom(""); setTo(""); setPage(1);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Auth Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Authentication events — logins, logouts, password resets, sessions
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, IP, action..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 max-w-48"
          >
            <option value="">All Actions</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
            title="From"
          />
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
            title="To"
          />

          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
            <Filter className="w-4 h-4 inline mr-1.5" />Filter
          </button>
          <button type="button" onClick={clearFilters} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-sm transition-all">
            Clear
          </button>
        </div>
      </form>

      <div className="text-xs text-slate-500 font-mono">
        {meta.total.toLocaleString()} total events &middot; page {meta.page} of {meta.totalPages}
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No logs found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">IP Address</th>
                <th className="text-left px-4 py-3 font-medium">Device</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono font-medium ${ACTION_COLOR[log.action] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
                        {ACTION_ICON[log.action] ?? <Clock className="w-3.5 h-3.5" />}
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> FAILURE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="text-slate-200 text-xs font-medium">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-slate-500 text-xs font-mono">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs font-mono">{log.ipAddress ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-500 text-xs truncate max-w-40 block" title={log.userAgent ?? ""}>
                        {log.userAgent
                          ? log.userAgent.length > 40
                            ? log.userAgent.substring(0, 40) + "…"
                            : log.userAgent
                          : "—"}
                      </span>
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
                    <tr key={`${log.id}-expanded`} className="bg-[#0d1526]">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6 text-xs">
                          <div className="space-y-2">
                            <Row label="Log ID" value={log.id} mono />
                            <Row label="User ID" value={log.userId ?? "—"} mono />
                            <Row label="Role" value={log.user?.role ?? "—"} />
                            <Row label="Session ID" value={log.sessionId ?? "—"} mono />
                            <Row label="Timestamp" value={formatDate(log.createdAt)} />
                          </div>
                          <div className="space-y-2">
                            <Row label="IP Address" value={log.ipAddress ?? "—"} mono />
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

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Showing {((page - 1) * 50) + 1}&#8211;{Math.min(page * 50, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400 px-2 font-mono">{page} / {meta.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
