"use client";

import { useState } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Search, ChevronRight, CheckCircle2, Clock, XCircle, Send, Eye,
  Users, ChevronDown, Sparkles,
} from "lucide-react";

type AppStatus = "New" | "Shortlisted" | "Interview" | "Rejected";

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode }> = {
  New:        { color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Send         className="w-3 h-3" /> },
  Shortlisted:{ color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3 h-3" /> },
  Interview:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock        className="w-3 h-3" /> },
  Rejected:   { color: "text-rose-700 bg-rose-50 border-rose-200",       icon: <XCircle      className="w-3 h-3" /> },
};

const APPLICANTS: {
  id: number; name: string; role: string; jobId: number;
  location: string; experience: string; status: AppStatus;
  applied: string; skills: string[];
}[] = [
  { id: 1, name: "Aryan Mehta",     role: "Senior Penetration Tester", jobId: 1, location: "Mumbai, IN",    experience: "5 yrs", status: "Shortlisted", applied: "2h ago",  skills: ["Burp Suite", "OSCP", "Python"]    },
  { id: 2, name: "Priya Sharma",    role: "Cloud Security Engineer",   jobId: 2, location: "Bangalore, IN", experience: "4 yrs", status: "Interview",   applied: "5h ago",  skills: ["AWS", "Terraform", "CSSP"]        },
  { id: 3, name: "Rohan Das",       role: "SOC Analyst II",            jobId: 3, location: "Delhi, IN",     experience: "3 yrs", status: "New",         applied: "1d ago",  skills: ["Splunk", "QRadar", "SIEM"]        },
  { id: 4, name: "Neha Kulkarni",   role: "Senior Penetration Tester", jobId: 1, location: "Pune, IN",      experience: "6 yrs", status: "New",         applied: "1d ago",  skills: ["Metasploit", "Kali", "GPEN"]      },
  { id: 5, name: "Vikram Singh",    role: "Red Team Operator",         jobId: 3, location: "Hyderabad, IN", experience: "7 yrs", status: "Shortlisted", applied: "2d ago",  skills: ["C2 Frameworks", "AD", "OPSEC"]    },
  { id: 6, name: "Ananya Roy",      role: "Cloud Security Engineer",   jobId: 2, location: "Chennai, IN",   experience: "3 yrs", status: "Rejected",    applied: "3d ago",  skills: ["GCP", "Docker", "Kubernetes"]     },
  { id: 7, name: "Karan Joshi",     role: "AppSec Engineer",           jobId: 4, location: "Remote",        experience: "4 yrs", status: "New",         applied: "3d ago",  skills: ["SAST", "DAST", "Secure SDLC"]    },
  { id: 8, name: "Shreya Nair",     role: "Senior Penetration Tester", jobId: 1, location: "Kolkata, IN",   experience: "5 yrs", status: "Interview",   applied: "4d ago",  skills: ["Web App", "API Testing", "OSWP"] },
];

const STATUS_FILTERS: (AppStatus | "All")[] = ["All", "New", "Shortlisted", "Interview", "Rejected"];

const JOB_OPTIONS = [
  { label: "All Jobs",                  value: "all" },
  { label: "Senior Penetration Tester", value: "1"   },
  { label: "Cloud Security Engineer",   value: "2"   },
  { label: "Red Team Operator",         value: "3"   },
  { label: "AppSec Engineer",           value: "4"   },
];

export default function ApplicantsPage() {
  const [statusFilter, setStatusFilter] = useState<AppStatus | "All">("All");
  const [jobFilter, setJobFilter]       = useState("all");
  const [search, setSearch]             = useState("");
  const [aiRank, setAiRank]             = useState(false);

  const filtered = APPLICANTS.filter((a) => {
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchJob    = jobFilter    === "all" || String(a.jobId) === jobFilter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchJob && matchSearch;
  });

  return (
    <>
      <EmployerTopbar title="Applicants" />
      <main className="flex-1 overflow-y-auto p-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {(["New", "Shortlisted", "Interview", "Rejected"] as AppStatus[]).map((s) => {
            const count = APPLICANTS.filter((a) => a.status === s).length;
            const cfg   = STATUS_CFG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
                className={`rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  statusFilter === s ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{count}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1.5">{s}</p>
                </div>
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${cfg.color}`}>
                  {cfg.icon}
                </span>
              </button>
            );
          })}
        </div>

        {/* AI Rank banner */}
        <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl border transition-all ${aiRank ? "bg-violet-50 border-violet-200" : "bg-white border-slate-200"}`}>
          <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">AI Candidate Ranking</p>
            <p className="text-xs text-slate-400">Automatically rank applicants by how well they match your job requirements</p>
          </div>
          <button
            type="button"
            onClick={() => setAiRank(!aiRank)}
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${aiRank ? "bg-violet-600" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${aiRank ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
          </button>
        </div>

        {aiRank && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Applicants are sorted by AI match score. Scores are based on skills, certifications, and experience.
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs shadow-sm">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicants…"
              className="text-sm bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none flex-1" />
          </div>

          {/* Job filter */}
          <div className="relative">
            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-400 pr-8 shadow-sm cursor-pointer">
              {JOB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium text-sm">No applicants match your filters</p>
              <button onClick={() => { setStatusFilter("All"); setJobFilter("all"); setSearch(""); }}
                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 font-mono">APPLICANT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden md:table-cell">APPLIED FOR</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden lg:table-cell">SKILLS</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">EXP</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono">STATUS</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">APPLIED</th>
                  {aiRank && <th className="text-center px-4 py-3 text-xs font-semibold text-violet-500 font-mono">AI SCORE</th>}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const cfg = STATUS_CFG[a.status];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                            {a.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{a.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{a.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell">
                        <p className="font-medium truncate max-w-[180px]">{a.role}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {a.skills.slice(0, 2).map((s) => (
                            <span key={s} className="px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 rounded-md">{s}</span>
                          ))}
                          {a.skills.length > 2 && <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-50 rounded-md">+{a.skills.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs hidden sm:table-cell">{a.experience}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}{a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-mono hidden sm:table-cell">{a.applied}</td>
                      {aiRank && (
                        <td className="px-4 py-3.5 text-center">
                          {(() => {
                            const scores = [91, 84, 67, 78, 88, 42, 73, 85];
                            const score = scores[(a.id - 1) % scores.length];
                            return (
                              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${score >= 80 ? "text-green-700 bg-green-50 border-green-200" : score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-rose-600 bg-rose-50 border-rose-200"}`}>
                                {score}%
                              </span>
                            );
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-3.5">
                        <Link href={`/employer/applicants/${a.id}`}
                          className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors opacity-0 group-hover:opacity-100">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs font-mono text-slate-400 mt-3">{filtered.length} of {APPLICANTS.length} applicants shown</p>
      </main>
    </>
  );
}
