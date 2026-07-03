"use client";

import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Briefcase, Users, Eye, TrendingUp, ArrowRight, ChevronRight,
  PlusCircle, CheckCircle2, Clock, XCircle, Send, Building2,
  BarChart2, Activity,
} from "lucide-react";

type AppStatus = "New" | "Shortlisted" | "Rejected" | "Interview";

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode }> = {
  New:        { color: "text-blue-700 bg-blue-50 border-blue-200",   icon: <Send className="w-3 h-3" />         },
  Shortlisted:{ color: "text-green-700 bg-green-50 border-green-200",icon: <CheckCircle2 className="w-3 h-3" /> },
  Interview:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock className="w-3 h-3" />   },
  Rejected:   { color: "text-rose-700 bg-rose-50 border-rose-200",   icon: <XCircle className="w-3 h-3" />     },
};

const RECENT_APPLICANTS: {
  id: number; name: string; role: string; status: AppStatus; time: string;
}[] = [
  { id: 1, name: "Aryan Mehta",    role: "Senior Penetration Tester", status: "New",         time: "2h ago"  },
  { id: 2, name: "Priya Sharma",   role: "Cloud Security Engineer",   status: "Shortlisted", time: "5h ago"  },
  { id: 3, name: "Rohan Das",      role: "SOC Analyst II",            status: "Interview",   time: "1d ago"  },
  { id: 4, name: "Neha Kulkarni",  role: "Red Team Operator",         status: "New",         time: "1d ago"  },
];

const ACTIVE_JOBS: {
  id: number; title: string; applicants: number; views: number; posted: string; status: "Active" | "Draft";
}[] = [
  { id: 1, title: "Senior Penetration Tester", applicants: 12, views: 340, posted: "3d ago",  status: "Active" },
  { id: 2, title: "Cloud Security Engineer",   applicants:  8, views: 210, posted: "5d ago",  status: "Active" },
  { id: 3, title: "Red Team Operator",         applicants:  5, views: 180, posted: "1w ago",  status: "Active" },
  { id: 4, title: "AppSec Engineer",           applicants:  0, views:   0, posted: "Today",   status: "Draft"  },
];

const QUICK_LINKS = [
  { label: "Post a Job",      href: "/employer/jobs/new",   icon: <PlusCircle  className="w-4 h-4" /> },
  { label: "View Applicants", href: "/employer/applicants", icon: <Users       className="w-4 h-4" /> },
  { label: "My Jobs",         href: "/employer/jobs",       icon: <Briefcase   className="w-4 h-4" /> },
  { label: "Company Profile", href: "/employer/company",    icon: <Building2   className="w-4 h-4" /> },
];

export default function EmployerDashboardPage() {
  return (
    <>
      <EmployerTopbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-5">

          {/* Greeting */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
            <div>
              {/* TODO: derive from session */}
              <h1 className="text-xl font-bold text-slate-900 leading-snug">Good morning, CyberShield Inc. 👋</h1>
              <p className="text-sm text-slate-500 mt-0.5">Here's your hiring overview for today</p>
            </div>
            <Link
              href="/employer/jobs/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Post a Job
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Jobs",       value: 3,   href: "/employer/jobs",       iconBg: "bg-blue-50 text-blue-600",   numColor: "text-blue-600",   icon: <Briefcase    className="w-5 h-5" /> },
              { label: "Total Applicants",  value: 25,  href: "/employer/applicants", iconBg: "bg-violet-50 text-violet-600", numColor: "text-violet-600", icon: <Users        className="w-5 h-5" /> },
              { label: "New This Week",     value: 9,   href: "/employer/applicants", iconBg: "bg-green-50 text-green-600", numColor: "text-green-600",  icon: <TrendingUp   className="w-5 h-5" /> },
              { label: "Total Views",       value: 730, href: "/employer/jobs",       iconBg: "bg-amber-50 text-amber-600", numColor: "text-amber-600",  icon: <Eye          className="w-5 h-5" /> },
            ].map(({ label, value, href, iconBg, numColor, icon }) => (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl border border-slate-200 px-4 py-4 flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className={`text-2xl font-bold leading-none ${numColor}`}>{value}</p>
                  <p className="text-xs text-slate-600 font-medium mt-1.5">{label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  {icon}
                </div>
              </Link>
            ))}
          </div>

          {/* Row 1: Recent Applicants + Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent Applicants */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-900">Recent Applicants</h2>
                </div>
                <Link href="/employer/applicants" className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {RECENT_APPLICANTS.map((a) => {
                  const cfg = STATUS_CFG[a.status];
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                          {a.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{a.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400">{a.time}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}{a.status}
                        </span>
                        <Link href={`/employer/applicants/${a.id}`} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Quick Links</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1 content-start">
                {QUICK_LINKS.map(({ label, href, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                  >
                    <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</span>
                    <span className="text-[11px] font-medium text-center leading-snug">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Active Job Listings + Hiring Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Active Job Listings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-900">Active Job Listings</h2>
                </div>
                <Link href="/employer/jobs" className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Manage all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {ACTIVE_JOBS.map((job) => (
                  <div key={job.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                          job.status === "Active"
                            ? "text-green-700 bg-green-50 border-green-200"
                            : "text-slate-500 bg-slate-50 border-slate-200"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">Posted {job.posted}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-300" />{job.applicants}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-slate-300" />{job.views}</span>
                      <Link href={`/employer/jobs/${job.id}/edit`} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                        Edit <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hiring Funnel */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Hiring Funnel</h2>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {[
                  { label: "Total Applied",  count: 25, pct: 100, color: "bg-blue-500"   },
                  { label: "Shortlisted",    count: 10, pct: 40,  color: "bg-violet-500" },
                  { label: "Interview",      count: 5,  pct: 20,  color: "bg-amber-500"  },
                  { label: "Offer Sent",     count: 2,  pct: 8,   color: "bg-green-500"  },
                ].map(({ label, count, pct, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 font-medium">{label}</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/employer/applicants"
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all"
              >
                View all applicants <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
