"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, ShieldOff, ShieldCheck,
  Filter,
} from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  profileImage?: string | null;
}

interface PageMeta { total: number; page: number; limit: number; totalPages: number }

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:           "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SUSPENDED:        "text-rose-400 bg-rose-500/10 border-rose-500/20",
  PENDING:          "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PENDING_DELETION: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  INACTIVE:         "text-slate-400 bg-slate-500/10 border-slate-500/20",
  DELETED:          "text-slate-600 bg-slate-500/5 border-slate-500/10",
};

const ROLE_COLOR: Record<string, string> = {
  SEEKER:   "text-blue-400",
  EMPLOYER: "text-violet-400",
  ADMIN:    "text-amber-400",
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (q) params.set("q", q);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await apiFetch(`/api/admin/users?${params}`);
      setUsers(data?.items ?? []);
      setMeta(data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSuspend(id: string, currentStatus: string) {
    const isSuspended = currentStatus === "SUSPENDED";
    setActing(id);
    try {
      await apiFetch(`/api/admin/users/${id}/${isSuspended ? "unsuspend" : "suspend"}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      showToast("success", isSuspended ? "User unsuspended" : "User suspended");
      fetchUsers();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  function clearFilters() { setQ(""); setRoleFilter(""); setStatusFilter(""); setPage(1); }

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
            <Users className="w-5 h-5 text-blue-400" /> Users
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage platform users</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); fetchUsers(); }}
        className="bg-[#111827] border border-white/5 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email…"
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
            <option value="">All Roles</option>
            <option value="SEEKER">Seeker</option>
            <option value="EMPLOYER">Employer</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500/50">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
            <option value="PENDING_DELETION">Pending Deletion</option>
            <option value="INACTIVE">Inactive</option>
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
        {meta.total.toLocaleString()} users · page {meta.page} of {meta.totalPages}
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Verified</th>
                <th className="text-left px-4 py-3 font-medium">Last Login</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-slate-200 font-medium text-xs">{u.firstName} {u.lastName}</p>
                    <p className="text-slate-500 text-[11px] font-mono">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${ROLE_COLOR[u.role] ?? "text-slate-400"}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${STATUS_COLOR[u.status] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isEmailVerified
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <XCircle className="w-4 h-4 text-slate-600" />}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-500 text-xs">{u.lastLogin ? relTime(u.lastLogin) : "Never"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-500 text-xs">{relTime(u.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.status !== "DELETED" && (
                      <button
                        onClick={() => handleSuspend(u.id, u.status)}
                        disabled={acting === u.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
                          u.status === "SUSPENDED"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        {u.status === "SUSPENDED"
                          ? <><ShieldCheck className="w-3.5 h-3.5" />Unsuspend</>
                          : <><ShieldOff className="w-3.5 h-3.5" />Suspend</>}
                      </button>
                    )}
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
