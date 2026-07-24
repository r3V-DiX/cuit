"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  Search, ChevronRight, CheckCircle2, Clock, XCircle, Send, Eye,
  Users, ChevronDown, Sparkles, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import { KycGate } from "@/components/employer/KycGate";
import { useKycStatus } from "@/lib/employer-context";
import { ApplicantTableSkeleton } from "@/components/ui/skeletons/ListRowSkeleton";

type AppStatus = "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "REJECTED" | "HIRED" | "WITHDRAWN" | "New" | "Shortlisted" | "Interview" | "Rejected";

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode }> = {
  New:        { color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Send         className="w-3 h-3" /> },
  Shortlisted:{ color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3 h-3" /> },
  Interview:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock        className="w-3 h-3" /> },
  Rejected:   { color: "text-rose-700 bg-rose-50 border-rose-200",       icon: <XCircle      className="w-3 h-3" /> },
  APPLIED:    { color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Send         className="w-3 h-3" /> },
  UNDER_REVIEW:{ color: "text-amber-700 bg-amber-50 border-amber-200",    icon: <Eye className="w-3 h-3" /> },
  SHORTLISTED:{ color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3 h-3" /> },
  INTERVIEW:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock        className="w-3 h-3" /> },
  OFFERED:    { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  HIRED:      { color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3 h-3" /> },
  REJECTED:   { color: "text-rose-700 bg-rose-50 border-rose-200",       icon: <XCircle      className="w-3 h-3" /> },
  WITHDRAWN:  { color: "text-slate-700 bg-slate-50 border-slate-200",    icon: <XCircle      className="w-3 h-3" /> },
};

const STATUS_FILTERS: (AppStatus | "All")[] = ["All", "APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "REJECTED"];

export default function ApplicantsPage() {
  const [statusFilter, setStatusFilter] = useState<AppStatus | "All">("All");
  const [jobFilter, setJobFilter]       = useState("all");
  const [search, setSearch]             = useState("");
  const [aiRank, setAiRank]             = useState(false);
  const [applicants, setApplicants]     = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [jobOptions, setJobOptions]     = useState<{label: string, value: string}[]>([{ label: "All Jobs", value: "all" }]);
  const { toast } = useToast();
  const kycStatus = useKycStatus();

  useEffect(() => {
    if (kycStatus !== "verified") return;
    async function fetchApplicants() {
      setLoading(true);
      try {
        const { data } = await apiFetch("/api/employer/applications");
        const listData = data as any;
        const items = listData?.items || [];
        setApplicants(items);

        // Dynamically populate job options from the fetched applications
        const jobsMap = new Map<string, string>();
        items.forEach((app: any) => {
          if (app.job) jobsMap.set(app.job.id, app.job.jobTitle);
        });
        const options = Array.from(jobsMap.entries()).map(([id, title]) => ({ label: title, value: id }));
        setJobOptions([{ label: "All Jobs", value: "all" }, ...options]);
      } catch (err) {
        toast({ type: "error", message: "Failed to fetch applications" });
      } finally {
        setLoading(false);
      }
    }
    fetchApplicants();
  }, [toast, kycStatus]);

  const filtered = applicants.filter((a) => {
    const matchStatus = statusFilter === "All" || a?.status === statusFilter;
    const matchJob    = jobFilter    === "all" || a?.jobId === jobFilter;
    const name = `${a.jobSeeker?.firstName || ""} ${a.jobSeeker?.lastName || ""}`.trim();
    const role = a.job?.jobTitle || "";
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || role.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchJob && matchSearch;
  });

  return (
    <>
      <EmployerTopbar title="Applicants" />
      <KycGate>
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {(["APPLIED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW", "REJECTED"] as AppStatus[]).map((s) => {
            const count = applicants.filter((a) => a.status === s).length;
            const cfg   = STATUS_CFG[s];
            if (!cfg) return null;
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
                  <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase">{s.replace("_", " ")}</p>
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
              className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:border-blue-400 pr-8 shadow-sm cursor-pointer max-w-[200px] truncate">
              {jobOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-120">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 font-mono">APPLICANT</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden md:table-cell">APPLIED FOR</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden lg:table-cell">SKILLS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">EXP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono">STATUS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">APPLIED</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <ApplicantTableSkeleton count={5} />
                </tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium text-sm">No applicants match your filters</p>
              <button onClick={() => { setStatusFilter("All"); setJobFilter("all"); setSearch(""); }}
                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-120">
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
                  const cfg = STATUS_CFG[a.status as AppStatus] || STATUS_CFG["New"];
                  const name = `${a.jobSeeker?.firstName || "Unknown"} ${a.jobSeeker?.lastName || ""}`.trim();
                  const role = a.job?.jobTitle || "Unknown Role";
                  const skills = a.jobSeeker?.jobSeekerProfile?.skills || [];
                  const expObj = a.jobSeeker?.jobSeekerProfile?.experiences?.[0];
                  const experience = expObj ? `${expObj.title} at ${expObj.company}` : "N/A";
                  const appliedDate = new Date(a.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 transition-colors">
                            {name[0] || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{a.jobSeeker?.location || "Remote"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell">
                        <p className="font-medium truncate max-w-[180px]">{role}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {skills.length > 0 ? (
                            <>
                              {skills.slice(0, 2).map((s: any) => (
                                <span key={s.skill?.name || s} className="px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 rounded-md">{s.skill?.name || s}</span>
                              ))}
                              {skills.length > 2 && <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-50 rounded-md">+{skills.length - 2}</span>}
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs hidden sm:table-cell">{experience}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                          {cfg.icon}{(a.status as string).replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 font-mono hidden sm:table-cell">{appliedDate}</td>
                      {aiRank && (
                        <td className="px-4 py-3.5 text-center">
                          {(() => {
                            const score = a.aiScore ? Math.round(a.aiScore) : 0;
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
            </div>
          )}
        </div>

        <p className="text-xs font-mono text-slate-400 mt-3">{filtered.length} of {applicants.length} applicants shown</p>
      </main>
      </KycGate>
    </>
  );
}
