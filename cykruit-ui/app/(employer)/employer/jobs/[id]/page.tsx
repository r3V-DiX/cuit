"use client";
// Fetches dynamic job details from the API
import { useState, useEffect, use } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  ChevronLeft, Edit3, MapPin, Briefcase, Users, Eye,
  CheckCircle2, Clock, XCircle, Send, ChevronRight,
  Sparkles, MessageSquare, BarChart2, Calendar,
} from "lucide-react";

type JobStatus  = "Active" | "Pending" | "Draft" | "Closed";
type AppStatus  = "New" | "Shortlisted" | "Interview" | "Rejected";

const JOB_STATUS_CFG: Record<JobStatus, { color: string; icon: React.ReactNode }> = {
  Active:  { color: "text-green-700 bg-green-50 border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Pending: { color: "text-amber-700 bg-amber-50 border-amber-200", icon: <Clock        className="w-3.5 h-3.5" /> },
  Draft:   { color: "text-slate-500 bg-slate-50 border-slate-200", icon: <Clock        className="w-3.5 h-3.5" /> },
  Closed:  { color: "text-rose-700 bg-rose-50 border-rose-200",    icon: <XCircle      className="w-3.5 h-3.5" /> },
};

const APP_STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode }> = {
  New:         { color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Send         className="w-3 h-3" /> },
  Shortlisted: { color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3 h-3" /> },
  Interview:   { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock        className="w-3 h-3" /> },
  Rejected:    { color: "text-rose-700 bg-rose-50 border-rose-200",       icon: <XCircle      className="w-3 h-3" /> },
};



const STATUS_FILTERS: (AppStatus | "All")[] = ["All", "New", "Shortlisted", "Interview", "Rejected"];

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [job, setJob] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [aiRank, setAiRank] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const [jobRes, appsRes] = await Promise.all([
          fetch(`/api/employer/jobs/${id}`, { credentials: "include" }),
          fetch(`/api/employer/jobs/${id}/applications`, { credentials: "include" }),
        ]);
        const result = await jobRes.json();
        const rawJob = result.data || result;
        if (rawJob && rawJob.id) {
           const statusMap: Record<string, JobStatus> = {
              "APPROVED": "Active",
              "PENDING": "Pending",
              "DRAFT": "Draft",
              "CLOSED": "Closed",
              "REJECTED": "Closed",
              "EXPIRED": "Closed"
            };
            const mapped = {
              id: rawJob.id,
              title: rawJob.jobTitle,
              domain: rawJob.role?.name || "Cybersecurity",
              type: rawJob.jobType?.replace("_", "-").toLowerCase().replace(/\b\w/g, (c: string) => (c as string).toUpperCase()) || "Full-time",
              location: rawJob.location?.displayName || "Remote",
              experience: rawJob.experienceLevel || "Mid-level",
              posted: new Date(rawJob.createdAt).toLocaleDateString(),
              status: statusMap[rawJob.status] || "Draft",
              views: rawJob.viewCount || 0,
              description: rawJob.description || "No description provided.",
              skills: rawJob.skills?.map((s: any) => s.skill.name) || [],
            };
            setJob(mapped);
        }
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const items = appsData.data?.items ?? appsData.items ?? [];
          const appStatusMap: Record<string, AppStatus> = {
            APPLIED: "New", UNDER_REVIEW: "New", SHORTLISTED: "Shortlisted",
            INTERVIEW: "Interview", REJECTED: "Rejected",
          };
          setApplicants(items.map((a: any) => ({
            id: a.id,
            name: `${a.jobSeeker?.firstName ?? ""} ${a.jobSeeker?.lastName ?? ""}`.trim() || "Applicant",
            jobId: a.jobId,
            location: a.jobSeeker?.location ?? "—",
            experience: a.experienceYears ? `${a.experienceYears} yrs` : "—",
            status: appStatusMap[a.status] ?? "New",
            applied: new Date(a.appliedAt ?? a.createdAt).toLocaleDateString(),
            skills: (a.skills ?? []).map((s: any) => s.skill?.name ?? s),
            aiScore: a.aiScore ?? null,
            aiScoreData: a.aiScoreData ?? null,
          })));
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Poll for AI Score updates when aiRank is active
  useEffect(() => {
    if (!aiRank) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/employer/jobs/${id}/applications`, { credentials: "include" });
        if (res.ok) {
          const appsData = await res.json();
          const items = appsData.data?.items ?? appsData.items ?? [];
          const appStatusMap: Record<string, AppStatus> = {
            APPLIED: "New", UNDER_REVIEW: "New", SHORTLISTED: "Shortlisted",
            INTERVIEW: "Interview", REJECTED: "Rejected",
          };
          setApplicants(items.map((a: any) => ({
            id: a.id,
            name: `${a.jobSeeker?.firstName ?? ""} ${a.jobSeeker?.lastName ?? ""}`.trim() || "Applicant",
            jobId: a.jobId,
            location: a.jobSeeker?.location ?? "—",
            experience: a.experienceYears ? `${a.experienceYears} yrs` : "—",
            status: appStatusMap[a.status] ?? "New",
            applied: new Date(a.appliedAt ?? a.createdAt).toLocaleDateString(),
            skills: (a.skills ?? []).map((s: any) => s.skill?.name ?? s),
            aiScore: a.aiScore ?? null,
            aiScoreData: a.aiScoreData ?? null,
          })));
        }
      } catch (e) {
        console.error("Error polling applications", e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, aiRank]);

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Job Detail" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-slate-500 font-medium text-sm">Loading job…</p>
          </div>
        </main>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <EmployerTopbar title="Job Detail" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Job not found</p>
            <Link href="/employer/jobs" className="text-xs text-blue-500 hover:underline mt-1 inline-block">Back to jobs</Link>
          </div>
        </main>
      </>
    );
  }

  const jobApplicants = applicants;
  const jcfg = JOB_STATUS_CFG[job.status as JobStatus] || JOB_STATUS_CFG.Draft;

  const filtered = jobApplicants.filter((a) => {
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const sorted = aiRank
    ? [...filtered].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0))
    : filtered;

  const countByStatus = (s: AppStatus) => jobApplicants.filter((a) => a.status === s).length;

  return (
    <>
      <EmployerTopbar title="Job Detail" />
      <main className="flex-1 overflow-y-auto p-6 space-y-5">

        <Link href="/employer/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to My Jobs
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl font-bold text-blue-600 shrink-0">
                {job.title?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900">{job.title}</h1>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${jcfg.color}`}>
                    {jcfg.icon} {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Briefcase className="w-3 h-3" /> {job.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" /> Posted {job.posted}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <BarChart2 className="w-3 h-3" /> {job.domain}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/employer/jobs/${job.id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> Edit Job
              </Link>
              <Link href={`/jobs/${job.id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Preview
              </Link>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 whitespace-pre-wrap">
            {job.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.skills?.map((s: string) => (
              <span key={s} className="px-2.5 py-1 text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded-lg">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400">Experience</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{job.experience}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Views</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-300" /> {job.views}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Applicants</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-300" /> {jobApplicants.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["New", "Shortlisted", "Interview", "Rejected"] as AppStatus[]).map((s) => {
            const count = countByStatus(s);
            const cfg   = APP_STATUS_CFG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}
                className={`rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer text-left ${
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

        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${aiRank ? "bg-violet-50 border-violet-200" : "bg-white border-slate-200"}`}>
          <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">AI Candidate Ranking</p>
            <p className="text-xs text-slate-400">Sort applicants by how well they match this job's requirements</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const newState = !aiRank;
              setAiRank(newState);
              if (newState) {
                // Trigger background ranking
                try {
                  console.log(`Triggering AI rank for job ${id}`);
                  const res = await fetch(`/api/employer/jobs/${id}/ai-rank`, { method: "POST", credentials: "include" });
                  if (!res.ok) console.error("AI rank fetch failed", await res.text());
                } catch (e) {
                  console.error("Failed triggering AI rank", e);
                }
              }
            }}
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${aiRank ? "bg-violet-600" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${aiRank ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 max-w-xs shadow-sm">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicants…"
                className="text-sm bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === s ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-8 h-8 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium text-sm">
                  {jobApplicants.length === 0 ? "No applicants yet" : "No applicants match your filters"}
                </p>
                {jobApplicants.length > 0 && (
                  <button onClick={() => { setStatusFilter("All"); setSearch(""); }}
                    className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 font-mono">APPLICANT</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden lg:table-cell">SKILLS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">EXP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono">STATUS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 font-mono hidden sm:table-cell">APPLIED</th>
                    {aiRank && <th className="text-center px-4 py-3 text-xs font-semibold text-violet-500 font-mono">AI SCORE</th>}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((a) => {
                    const cfg = APP_STATUS_CFG[a.status as AppStatus] ?? APP_STATUS_CFG.New;
                    const score = a.aiScore ?? 0;
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
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {a.skills.slice(0, 2).map((s: string) => (
                              <span key={s} className="px-2 py-0.5 text-[10px] font-mono text-slate-600 bg-slate-100 rounded-md">{s}</span>
                            ))}
                            {a.skills.length > 2 && (
                              <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-50 rounded-md">+{a.skills.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 hidden sm:table-cell">{a.experience}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border ${cfg.color}`}>
                            {cfg.icon} {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-400 font-mono hidden sm:table-cell">{a.applied}</td>
                        {aiRank && (
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${
                              a.aiScore === null ? "text-slate-500 bg-slate-50 border-slate-200"
                              : score >= 80 ? "text-green-700 bg-green-50 border-green-200"
                              : score >= 60 ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-rose-600 bg-rose-50 border-rose-200"
                            }`}>
                              {a.aiScore === null ? "Pending" : `${score}%`}
                            </span>
                            {(a.aiScoreData?.reasoning || a.aiScoreData?.summary) && (
                              <div className="mt-2 text-[10px] text-slate-500 leading-tight text-left max-w-[200px] mx-auto line-clamp-3" title={a.aiScoreData.reasoning || a.aiScoreData.summary}>
                                {a.aiScoreData.reasoning || a.aiScoreData.summary}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/employer/applicants/${a.id}`}
                              className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                              View <ChevronRight className="w-3 h-3" />
                            </Link>
                            <span className="text-slate-200 mx-1">|</span>
                            <Link href="/employer/messages"
                              className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors">
                              <MessageSquare className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs font-mono text-slate-400">
            {sorted.length} of {jobApplicants.length} applicants shown
          </p>
        </div>

      </main>
    </>
  );
}
