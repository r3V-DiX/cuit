"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  ArrowLeft, MapPin, Briefcase, CheckCircle2, Clock, XCircle, Send,
  Mail, Phone, Globe, Award, ChevronRight, MessageSquare, Calendar,
  Download, Sparkles, TrendingUp, TrendingDown, Minus,
  ShieldCheck, AlertTriangle, ThumbsUp,
} from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";

type AppStatus = "New" | "Shortlisted" | "Under Review" | "Rejected" | "Withdrawn";

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode; label: string }> = {
  New:            { color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Send         className="w-3.5 h-3.5" />, label: "New"         },
  "Under Review": { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock        className="w-3.5 h-3.5" />, label: "Under Review" },
  Shortlisted:    { color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Shortlisted" },
  Rejected:       { color: "text-rose-700 bg-rose-50 border-rose-200",       icon: <XCircle      className="w-3.5 h-3.5" />, label: "Rejected"    },
  Withdrawn:      { color: "text-slate-500 bg-slate-100 border-slate-200",   icon: <Minus        className="w-3.5 h-3.5" />, label: "Withdrawn"   },
};

const STATUS_FLOW: AppStatus[] = ["New", "Under Review", "Shortlisted", "Rejected"];

export default function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<AppStatus>("New");
  const [notes, setNotes]   = useState("");

  useEffect(() => {
    async function fetchApp() {
      try {
        const { data } = await apiFetch(`/api/employer/applications/${id}`);
        setApp(data);

        let mappedStatus: AppStatus = "New";
        if (data.status === "UNDER_REVIEW") mappedStatus = "Under Review";
        if (data.status === "SHORTLISTED") mappedStatus = "Shortlisted";
        if (data.status === "REJECTED") mappedStatus = "Rejected";
        if (data.status === "WITHDRAWN") mappedStatus = "Withdrawn";
        setStatus(mappedStatus);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <>
        <EmployerTopbar title="Applicant Detail" />
        <main className="flex-1 flex items-center justify-center text-slate-400">Loading...</main>
      </>
    );
  }

  if (!app) {
    return (
      <>
        <EmployerTopbar title="Applicant Detail" />
        <main className="flex-1 flex items-center justify-center text-slate-400">Applicant not found</main>
      </>
    );
  }

  const cfg = STATUS_CFG[status];

  // Format seeker profile data safely
  const profile = app.seeker?.profile || {};
  const user = app.seeker || {};
  const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Applicant";

  // AI score data safely parsed
  const aiScoreData = app.aiScoreData || {};
  const ai = {
    score: app.aiScore || 0,
    verdict: app.aiScore >= 80 ? "Strong Match" : app.aiScore >= 60 ? "Good Match" : "Weak Match",
    verdictColor: app.aiScore >= 80 ? "text-green-700" : app.aiScore >= 60 ? "text-amber-700" : "text-rose-700",
    verdictBg: app.aiScore >= 80 ? "bg-green-50 border-green-200" : app.aiScore >= 60 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200",
    recommendation: aiScoreData.summary || "No AI recommendation available.",
    dimensions: [
      { label: "Skills match", score: aiScoreData.breakdown?.skills || 0, icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-blue-400", textColor: "text-blue-700" },
      { label: "Experience", score: aiScoreData.breakdown?.experience || 0, icon: <TrendingUp className="w-3.5 h-3.5" />, color: "bg-blue-400", textColor: "text-blue-700" },
    ],
    strengths: ["Matching skills found in profile"],
    weaknesses: ["Missing some core requirements"],
    requiredSkillsMatched: (profile.skills || []).map((s: any): string => s.skill.name).slice(0, 5),
    requiredSkillsMissing: []
  };

  return (
    <>
      <EmployerTopbar title="Applicant Detail" />
      <main className="flex-1 overflow-y-auto p-6">

        <Link href="/employer/applicants" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Applicants
        </Link>

        {/* ── Full-width header ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 shrink-0">
              {name[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-mono ${cfg.color}`}>
                  {cfg.icon}{cfg.label}
                </span>
                {/* AI score badge in header */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-violet-200 bg-violet-50 text-[11px] font-bold text-violet-700 font-mono">
                  <Sparkles className="w-3 h-3" /> {ai.score}% AI Match
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{profile.headline || "Job Seeker"}</p>
              <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin    className="w-3.5 h-3.5 text-slate-400" />{profile.location || "Remote"}</span>
                <span className="flex items-center gap-1.5"><Mail      className="w-3.5 h-3.5 text-slate-400" />{user.email}</span>
                {profile.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{profile.phone}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                <Calendar className="w-4 h-4" /> Schedule Interview
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                <MessageSquare className="w-4 h-4" /> Message
              </button>
              {app.resume && (
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                  <Download className="w-4 h-4" /> Resume
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 2-col body ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* Left: profile content */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* ── AI Candidate Analysis (above summary) ───────────────────── */}
            <div className="rounded-2xl border-2 border-violet-200 bg-linear-to-br from-violet-50 to-white overflow-hidden">

              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-violet-600 border-b border-violet-500">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <p className="text-sm font-bold text-white">AI Candidate Analysis</p>
                  <span className="text-[9px] font-bold text-violet-600 bg-white px-1.5 py-0.5 rounded-full">AI</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${ai.verdictBg} ${ai.verdictColor}`}>
                  {ai.verdict}
                </span>
              </div>

              <div className="p-5">

                {/* Score + recommendation row */}
                <div className="flex items-start gap-5 mb-5 flex-wrap">

                  {/* Big score ring */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="relative w-20 h-20">
                      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#ede9fe" strokeWidth="8" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#7c3aed" strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(ai.score / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-violet-700 leading-none">{ai.score}%</span>
                        <span className="text-[9px] font-mono text-violet-500 mt-0.5">match</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <ThumbsUp className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-violet-900">Hiring Recommendation</p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{ai.recommendation}</p>
                  </div>
                </div>

                {/* Dimension bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {ai.dimensions.map((d) => (
                    <div key={d.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${d.textColor}`}>
                          {d.icon}{d.label}
                        </div>
                        <span className={`text-xs font-bold font-mono ${d.textColor}`}>{d.score}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${d.color}`} style={{ width: `${d.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths + Weaknesses side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-bold text-green-800">Where they're strong</p>
                    </div>
                    <div className="space-y-2">
                      {ai.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <p className="text-xs font-bold text-amber-800">Areas to probe</p>
                    </div>
                    <div className="space-y-2">
                      {ai.weaknesses.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Required skills match */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-2.5">Job Requirements Match</p>
                  <div className="flex flex-wrap gap-2">
                    {ai.requiredSkillsMatched.map((s: string) => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" />{s}
                      </span>
                    ))}
                    {ai.requiredSkillsMissing.map((s) => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                        <XCircle className="w-3 h-3" />{s}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Summary</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio || "No summary provided."}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).map((s: any) => (
                  <span key={s.id} className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border ${
                    ai.requiredSkillsMatched.includes(s.skill.name)
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-slate-700 bg-slate-100 border-slate-200"
                  }`}>{s.skill.name}</span>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <p className="text-sm text-slate-500">No skills listed.</p>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-2.5">
                <span className="text-green-600 font-semibold">Green</span> = matches job requirements
              </p>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Experience</h2>
              <div className="space-y-4">
                {(profile.experience || []).map((e: any) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{e.company} · {new Date(e.startDate).getFullYear()} – {e.isCurrent ? 'Present' : (e.endDate ? new Date(e.endDate).getFullYear() : '')}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{e.description}</p>
                    </div>
                  </div>
                ))}
                {(!profile.experience || profile.experience.length === 0) && (
                  <p className="text-sm text-slate-500">No experience listed.</p>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Certifications</h2>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">No certifications listed.</p>
              </div>
            </div>

          </div>

          {/* Right: sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4 sticky top-6">

            {/* Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Update Status</p>
              <div className="flex flex-col gap-2">
                {STATUS_FLOW.map((s) => {
                  const c = STATUS_CFG[s];
                  return (
                    <button key={s} onClick={async () => {
                        try {
                          let backendStatus = "APPLIED";
                          if (s === "Under Review") backendStatus = "UNDER_REVIEW";
                          if (s === "Shortlisted") backendStatus = "SHORTLISTED";
                          if (s === "Rejected") backendStatus = "REJECTED";

                          await apiFetch(`/api/employer/applications/${id}/status`, {
                            method: "PATCH",
                            headers: authHeaders(),
                            body: JSON.stringify({ status: backendStatus })
                          });
                          setStatus(s);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      disabled={status === "Withdrawn"}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        status === s ? c.color + " shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                      } ${status === "Withdrawn" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {c.icon}{c.label}
                      {status === s && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Internal notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Internal Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this applicant…"
                rows={4}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none"
              />
              <button className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                Save note
              </button>
            </div>

            {/* Applied for */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Applied For</p>
              <p className="text-sm font-semibold text-slate-900">{app.job?.jobTitle}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{new Date(app.appliedAt).toLocaleDateString()}</p>
              <Link href={`/employer/jobs/${app.jobId}/edit`} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-2">
                View job posting <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
