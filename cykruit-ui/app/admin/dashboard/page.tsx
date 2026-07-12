"use client";

import { useState, useEffect } from "react";
import {
  Users, Briefcase, Shield, CreditCard, FileText,
  TrendingUp, Clock, RefreshCw, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  users: { total: number; seekers: number; employers: number };
  jobs: { active: number; pendingApproval: number };
  kyc: { pendingReview: number };
  applications: { total: number };
  subscriptions: { active: number };
  recentActivity: {
    newRegistrations30d: number;
    byRole: { role: string; count: number }[];
    newApprovedJobs30d: number;
  };
}

function StatCard({
  title, value, sub, icon: Icon, color, href,
}: {
  title: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div className="bg-[#111827] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {href && <span className="text-[10px] text-slate-600 font-mono">View →</span>}
      </div>
      <p className="text-2xl font-bold text-white font-mono">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{title}</p>
      {sub && <p className="text-[11px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const { data } = await apiFetch<DashboardStats>("/api/admin/dashboard");
      setStats(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platform overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load dashboard stats.
        </div>
      )}

      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={stats.users.total} sub={`${stats.users.seekers} seekers · ${stats.users.employers} employers`} icon={Users} color="bg-blue-600/20 text-blue-400" href="/admin/users" />
            <StatCard title="Active Jobs" value={stats.jobs.active} sub={`${stats.jobs.pendingApproval} pending approval`} icon={Briefcase} color="bg-violet-600/20 text-violet-400" href="/admin/jobs" />
            <StatCard title="KYC Pending" value={stats.kyc.pendingReview} icon={Shield} color="bg-amber-600/20 text-amber-400" href="/admin/kyc" />
            <StatCard title="Applications" value={stats.applications.total} icon={FileText} color="bg-slate-600/20 text-slate-400" />
            <StatCard title="Active Subscriptions" value={stats.subscriptions.active} icon={CreditCard} color="bg-emerald-600/20 text-emerald-400" href="/admin/subscriptions" />
            <StatCard title="New Users (30d)" value={stats.recentActivity.newRegistrations30d} icon={TrendingUp} color="bg-cyan-600/20 text-cyan-400" />
            <StatCard title="Jobs Approved (30d)" value={stats.recentActivity.newApprovedJobs30d} icon={Clock} color="bg-indigo-600/20 text-indigo-400" />
          </div>

          {stats.recentActivity.byRole.length > 0 && (
            <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mb-4">Registrations by role (30d)</p>
              <div className="flex gap-6">
                {stats.recentActivity.byRole.map(({ role, count }) => (
                  <div key={role}>
                    <p className="text-lg font-bold text-white font-mono">{count.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 capitalize">{role.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
