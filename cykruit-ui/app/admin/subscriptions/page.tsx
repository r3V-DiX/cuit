"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Filter, Clock,
} from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";

interface SubItem {
  id: string;
  status: string;
  billingCycle: string;
  expiresAt: string | null;
  startedAt: string | null;
  createdAt: string;
  employer: { id: string; companyName: string; slug: string };
  package: { id: string; name: string };
}

interface PageMeta { total: number; page: number; limit: number; totalPages: number }

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  EXPIRED:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  CANCELLED: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

// Only meaningful transitions: ACTIVE → CANCELLED or EXPIRED. Others are terminal.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ACTIVE:    ["CANCELLED", "EXPIRED"],
  EXPIRED:   [],
  CANCELLED: [],
};

function relTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const s = Math.floor(abs / 1000);
  if (s < 60) return diff < 0 ? `${s}s ago` : `in ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return diff < 0 ? `${m}m ago` : `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return diff < 0 ? `${h}h ago` : `in ${h}h`;
  const d = Math.floor(h / 24);
  return diff < 0 ? `${d}d ago` : `in ${d}d`;
}

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<SubItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (q) params.set("q", q);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await apiFetch(`/api/admin/subscriptions?${params}`);
      setItems(data?.items ?? []);
      setMeta(data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, statusFilter]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  async function handleStatusChange(id: string, newStatus: string) {
    setActing(id + newStatus);
    try {
      await apiFetch(`/api/admin/subscriptions/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      showToast("success", `Status changed to ${newStatus}`);
      fetchSubs();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  function clearFilters() { setQ(""); setStatusFilter(""); setPage(1); }

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${toast.type === "success" ? "bg-emerald-950 border-emerald-500/30 text-emerald-300" : "bg-rose-950 border-rose-500/30 text-rose-300"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Subscriptions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage employer subscription plans</p>
        </div>
        <button onClick={fetchSubs} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchSubs(); }}
        className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search company name…"
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all">
            <Filter className="w-4 h-4 inline mr-1.5" />Filter
          </button>
          <button type="button" onClick={clearFilters} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-sm transition-all">
            Clear
          </button>
        </div>
      </form>

      <div className="text-xs text-slate-500 font-mono">
        {meta.total.toLocaleString()} subscriptions · page {meta.page} of {meta.totalPages}
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No subscriptions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Employer</th>
                <th className="text-left px-4 py-3 font-medium">Package</th>
                <th className="text-left px-4 py-3 font-medium">Cycle</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map((sub) => {
                const allowed = ALLOWED_TRANSITIONS[sub.status] ?? [];
                return (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium text-xs">{sub.employer.companyName}</p>
                      <p className="text-slate-500 text-[11px] font-mono">/{sub.employer.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-xs font-medium">{sub.package.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-500 text-xs font-mono">{sub.billingCycle}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${STATUS_COLOR[sub.status] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
                        {sub.status === "ACTIVE" && <CheckCircle2 className="w-3 h-3" />}
                        {sub.status === "EXPIRED" && <AlertTriangle className="w-3 h-3" />}
                        {sub.status === "CANCELLED" && <XCircle className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{sub.expiresAt ? relTime(sub.expiresAt) : "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {allowed.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {allowed.map((next) => (
                            <button
                              key={next}
                              onClick={() => handleStatusChange(sub.id, next)}
                              disabled={acting === sub.id + next}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-40 ${
                                next === "CANCELLED"
                                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                  : "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                              }`}
                            >
                              {acting === sub.id + next ? "…" : `→ ${next}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
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
