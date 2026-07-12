"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Filter, Eye,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface KycItem {
  id: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  employer: {
    id: string;
    companyName: string;
    slug: string;
    contactEmail: string;
    companyLogo?: string | null;
  };
}

interface PageMeta { total: number; page: number; limit: number; totalPages: number }

const STATUS_COLOR: Record<string, string> = {
  PENDING:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
  UNDER_REVIEW: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  APPROVED:     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REJECTED:     "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

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

export default function AdminKycPage() {
  const [items, setItems] = useState<KycItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [page, setPage] = useState(1);

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (q) params.set("q", q);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await apiFetch(`/api/admin/kyc?${params}`);
      setItems(data?.items ?? []);
      setMeta(data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, statusFilter]);

  useEffect(() => { fetchKyc(); }, [fetchKyc]);

  function clearFilters() { setQ(""); setStatusFilter("PENDING"); setPage(1); }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> KYC Verification
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Review employer verification submissions</p>
        </div>
        <button onClick={fetchKyc} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchKyc(); }}
        className="bg-[#111827] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search company name, email…"
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
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
        {meta.total.toLocaleString()} records · page {meta.page} of {meta.totalPages}
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No KYC submissions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
                <th className="text-left px-4 py-3 font-medium">Reviewed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium text-xs">{item.employer.companyName}</p>
                    <p className="text-slate-500 text-[11px] font-mono">{item.employer.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${STATUS_COLOR[item.status] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
                      {item.status === "APPROVED" && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                      {item.status === "PENDING" && <AlertTriangle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-xs">{relTime(item.submittedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-500 text-xs">{item.reviewedAt ? relTime(item.reviewedAt) : "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/kyc/${item.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                      <Eye className="w-3.5 h-3.5" /> Review
                    </Link>
                  </td>
                </tr>
              ))}
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
