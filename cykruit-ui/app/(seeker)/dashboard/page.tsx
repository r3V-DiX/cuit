"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import {
  FileText,
  Bookmark,
  User,
  Sparkles,
  TrendingUp,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Briefcase,
  Activity,
  ChevronRight,
  Send,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AppStatus = "Applied" | "Under Review" | "Shortlisted";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode }> = {
  Applied:        { color: "text-blue-700 bg-blue-50 border-blue-200",    icon: <Send className="w-3 h-3" />         },
  "Under Review": { color: "text-amber-700 bg-amber-50 border-amber-200", icon: <Eye className="w-3 h-3" />          },
  Shortlisted:    { color: "text-green-700 bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
};

// ─── Seed data ─────────────────────────────────────────────────────────────────

const RECENT_APPS: { id: number; role: string; company: string; status: AppStatus }[] = [
  { id: 1, role: "Senior Penetration Tester", company: "CrowdStrike",       status: "Shortlisted"   },
  { id: 2, role: "Cloud Security Engineer",   company: "Palo Alto Networks", status: "Under Review"  },
  { id: 3, role: "SOC Analyst II",            company: "Mandiant",           status: "Applied"       },
];

const RECOMMENDED_JOBS: {
  id: number;
  role: string;
  company: string;
  match: number;
  matchColor: string;
}[] = [
  { id: 9,  role: "Red Team Lead",   company: "Microsoft", match: 92, matchColor: "text-green-700 bg-green-50 border-green-200" },
  { id: 11, role: "AppSec Engineer", company: "GitHub",    match: 87, matchColor: "text-green-700 bg-green-50 border-green-200" },
  { id: 12, role: "Cloud Pentester", company: "Zscaler",   match: 74, matchColor: "text-amber-700 bg-amber-50 border-amber-200" },
];

const PROFILE_CHECKS: { label: string; done: boolean }[] = [
  { label: "Experience",     done: true  },
  { label: "Skills",         done: true  },
  { label: "Certifications", done: true  },
  { label: "CTF Profile",    done: false },
  { label: "Portfolio link", done: false },
];

const QUICK_LINKS: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "Browse Jobs",       href: "/jobs",         icon: <Briefcase className="w-4 h-4" /> },
  { label: "View Applications", href: "/applications", icon: <FileText className="w-4 h-4" />  },
  { label: "Saved Jobs",        href: "/saved",        icon: <Bookmark className="w-4 h-4" />  },
  { label: "Edit Profile",      href: "/profile",      icon: <User className="w-4 h-4" />      },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [profilePct, setProfilePct] = useState(0);
  const [profileChecks, setProfileChecks] = useState([
    { label: "Experience",     done: false },
    { label: "Skills",         done: false },
    { label: "Certifications", done: false },
    { label: "CTF Profile",    done: false },
    { label: "Portfolio link", done: false },
  ]);

  useEffect(() => {
    async function fetchUserAndProfile() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userResult = await userRes.json();
          if (userResult.data?.firstName) {
            setUserName(userResult.data.firstName);
          }
        }

        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileResult = await profileRes.json();
          if (profileResult.data) {
            const data = profileResult.data;
            const hasExp = Array.isArray(data.experiences) && data.experiences.length > 0;
            const hasSkills = Array.isArray(data.skills) && data.skills.length > 0;
            const hasCerts = Array.isArray(data.certifications) && data.certifications.length > 0;
            const hasCtf = Array.isArray(data.ctfProfiles) && data.ctfProfiles.length > 0;
            const hasPortfolio = !!data.basicInfo?.portfolio;

            const checks = [
              { label: "Experience",     done: hasExp },
              { label: "Skills",         done: hasSkills },
              { label: "Certifications", done: hasCerts },
              { label: "CTF Profile",    done: hasCtf },
              { label: "Portfolio link", done: hasPortfolio },
            ];
            setProfileChecks(checks);

            const doneCount = checks.filter((c) => c.done).length;
            setProfilePct(Math.round((doneCount / checks.length) * 100));
          }
        }
      } catch (error) {
        // Silent catch for guest fallback
      }
    }
    fetchUserAndProfile();
  }, []);

  // SVG ring params
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (profilePct / 100) * circ;

  return (
    <>
      <SeekerTopbar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-5">

          {/* ── Greeting banner ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">Good morning, {userName}</h1>
              <p className="text-sm text-slate-500 mt-0.5">Here is your job search overview</p>
            </div>

            {/* Profile completion inline card */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shrink-0 flex-wrap">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700">Profile completion</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Add more to get noticed</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${profilePct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600 font-mono">{profilePct}%</span>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
              >
                Complete <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Stats row (4 cols) ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label:    "Total Applied",
                value:    6,
                href:     "/applications",
                iconBg:   "bg-blue-50 text-blue-600",
                numColor: "text-blue-600",
                icon:     <FileText className="w-5 h-5" />,
              },
              {
                label:    "Shortlisted",
                value:    1,
                href:     "/applications",
                iconBg:   "bg-green-50 text-green-600",
                numColor: "text-green-600",
                icon:     <CheckCircle2 className="w-5 h-5" />,
              },
              {
                label:    "Profile Views",
                sublabel: "this week",
                value:    14,
                href:     "/profile",
                iconBg:   "bg-violet-50 text-violet-600",
                numColor: "text-violet-600",
                icon:     <Eye className="w-5 h-5" />,
              },
              {
                label:    "Saved Jobs",
                value:    5,
                href:     "/saved",
                iconBg:   "bg-amber-50 text-amber-600",
                numColor: "text-amber-600",
                icon:     <Bookmark className="w-5 h-5" />,
              },
            ].map(({ label, sublabel, value, href, iconBg, numColor, icon }) => (
              <Link
                key={label}
                href={href}
                className="bg-white rounded-2xl border border-slate-200 px-4 py-4 flex items-center justify-between gap-3 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className={`text-2xl font-bold leading-none ${numColor}`}>{value}</p>
                  <p className="text-xs text-slate-600 font-medium mt-1.5">{label}</p>
                  {sublabel && (
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{sublabel}</p>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  {icon}
                </div>
              </Link>
            ))}
          </div>

          {/* ── Row 1: Recent Applications + Profile Strength ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recent Applications */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-900">Recent Applications</h2>
                </div>
                <Link
                  href="/applications"
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {RECENT_APPS.map((app) => {
                  const cfg = STATUS_CFG[app.status];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                          {app.company[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{app.role}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{app.company}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}{app.status}
                        </span>
                        <Link
                          href={`/applications/${app.id}`}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Strength */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">Profile Strength</h2>
              </div>

              <div className="flex items-center gap-5 mb-4 flex-1">
                <div className="relative shrink-0">
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r={r}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${circ - dash}`}
                      strokeDashoffset={circ / 4}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-900 leading-none">{profilePct}%</span>
                    <span className="text-[10px] font-mono text-green-600 mt-0.5">Strong</span>
                  </div>
                </div>

                <div className="space-y-1.5 flex-1">
                  {profileChecks.map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      {done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      }
                      <span className={`text-xs ${done ? "text-slate-700" : "text-slate-400"}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/profile"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all mt-auto"
              >
                Edit profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* ── Row 2: Recommended Jobs + Quick Links ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Recommended Jobs */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <h2 className="text-sm font-semibold text-slate-900">Recommended Jobs</h2>
                  <span className="text-[10px] font-mono text-violet-500 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded-md">AI</span>
                </div>
                <Link
                  href="/jobs"
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Browse all jobs <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {RECOMMENDED_JOBS.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-violet-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                        {job.company[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{job.role}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${job.matchColor}`}>
                        {job.match}% match
                      </span>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
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
                    <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                      {icon}
                    </span>
                    <span className="text-[11px] font-medium text-center leading-snug">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
