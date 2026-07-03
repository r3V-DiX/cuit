"use client";

import { use, useState } from "react";
import Link from "next/link";
import EmployerTopbar from "@/components/employer/EmployerTopbar";
import {
  ArrowLeft, MapPin, Briefcase, CheckCircle2, Clock, XCircle, Send,
  Mail, Phone, Globe, Award, ChevronRight, MessageSquare, Calendar,
  Download, Sparkles, TrendingUp, TrendingDown, Minus,
  ShieldCheck, AlertTriangle, ThumbsUp,
} from "lucide-react";

type AppStatus = "New" | "Shortlisted" | "Interview" | "Rejected";

const STATUS_CFG: Record<AppStatus, { color: string; icon: React.ReactNode; label: string }> = {
  New:        { color: "text-blue-700 bg-blue-50 border-blue-200",       icon: <Send         className="w-3.5 h-3.5" />, label: "New"         },
  Shortlisted:{ color: "text-green-700 bg-green-50 border-green-200",    icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Shortlisted" },
  Interview:  { color: "text-violet-700 bg-violet-50 border-violet-200", icon: <Clock        className="w-3.5 h-3.5" />, label: "Interview"   },
  Rejected:   { color: "text-rose-700 bg-rose-50 border-rose-200",       icon: <XCircle      className="w-3.5 h-3.5" />, label: "Rejected"    },
};

const SEED = {
  id: 1,
  name: "Aryan Mehta",
  role: "Senior Penetration Tester",
  location: "Mumbai, India",
  email: "aryan.mehta@example.com",
  phone: "+91 98765 43210",
  website: "aryanmehta.dev",
  experience: "5 years",
  status: "Shortlisted" as AppStatus,
  applied: "2 hours ago",
  summary: "Experienced penetration tester with 5+ years of hands-on expertise in web application, network, and mobile security. OSCP certified with a strong track record in bug bounty programs.",
  skills: ["Burp Suite", "Metasploit", "Python", "OSCP", "GPEN", "AWS", "Web App Testing", "API Security"],
  certifications: ["OSCP — Offensive Security", "CEH — EC-Council", "AWS Security Specialty"],
  experience_list: [
    { title: "Senior Security Analyst", company: "Wipro CyberSec",        duration: "2021 – Present", desc: "Led red team assessments and delivered detailed reports."  },
    { title: "Penetration Tester",      company: "HackerOne (Bug Bounty)", duration: "2019 – 2021",   desc: "Reported 40+ critical and high severity bugs." },
  ],
  notes: "",
};

// AI analysis data (mock — replace with real API response)
const AI_ANALYSIS = {
  score: 84,
  verdict: "Strong Match",
  verdictColor: "text-green-700",
  verdictBg: "bg-green-50 border-green-200",
  recommendation: "Aryan is a strong fit for this role. His OSCP certification, 5 years of hands-on penetration testing, and proven bug bounty track record align closely with your requirements. Minor gaps in cloud security (AWS depth) and formal red team operations are worth exploring in the interview.",
  dimensions: [
    { label: "Skills match",       score: 90, icon: <TrendingUp   className="w-3.5 h-3.5" />, color: "bg-green-400",  textColor: "text-green-700"  },
    { label: "Experience level",   score: 82, icon: <TrendingUp   className="w-3.5 h-3.5" />, color: "bg-green-400",  textColor: "text-green-700"  },
    { label: "Certifications",     score: 88, icon: <TrendingUp   className="w-3.5 h-3.5" />, color: "bg-green-400",  textColor: "text-green-700"  },
    { label: "Cloud experience",   score: 45, icon: <TrendingDown className="w-3.5 h-3.5" />, color: "bg-amber-400",  textColor: "text-amber-700"  },
    { label: "Red team ops",       score: 60, icon: <Minus        className="w-3.5 h-3.5" />, color: "bg-amber-300",  textColor: "text-amber-600"  },
  ],
  strengths: [
    "OSCP certified — directly matches job requirement",
    "5 years experience exceeds the 3-year minimum",
    "Active bug bounty track record shows real-world impact",
    "Proficient in Burp Suite and Metasploit — core tools required",
  ],
  weaknesses: [
    "Cloud security depth (AWS) is limited — role involves cloud assessments",
    "No formal red team infrastructure experience mentioned",
  ],
  requiredSkillsMatched: ["Burp Suite", "OSCP", "Python", "Metasploit", "Web App Testing"],
  requiredSkillsMissing: ["AWS Red Team", "Active Directory"],
};

const STATUS_FLOW: AppStatus[] = ["New", "Shortlisted", "Interview", "Rejected"];

export default function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = use(params);
  const [status, setStatus] = useState<AppStatus>(SEED.status);
  const [notes, setNotes]   = useState(SEED.notes);

  const cfg = STATUS_CFG[status];
  const ai  = AI_ANALYSIS;

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
              {SEED.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{SEED.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-mono ${cfg.color}`}>
                  {cfg.icon}{cfg.label}
                </span>
                {/* AI score badge in header */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-violet-200 bg-violet-50 text-[11px] font-bold text-violet-700 font-mono">
                  <Sparkles className="w-3 h-3" /> {ai.score}% AI Match
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{SEED.role}</p>
              <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin    className="w-3.5 h-3.5 text-slate-400" />{SEED.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{SEED.experience} experience</span>
                <span className="flex items-center gap-1.5"><Mail      className="w-3.5 h-3.5 text-slate-400" />{SEED.email}</span>
                <span className="flex items-center gap-1.5"><Phone     className="w-3.5 h-3.5 text-slate-400" />{SEED.phone}</span>
                <span className="flex items-center gap-1.5"><Globe     className="w-3.5 h-3.5 text-slate-400" />{SEED.website}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                <Calendar className="w-4 h-4" /> Schedule Interview
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                <MessageSquare className="w-4 h-4" /> Message
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                <Download className="w-4 h-4" /> Resume
              </button>
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
                    {ai.requiredSkillsMatched.map((s) => (
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
              <p className="text-sm text-slate-600 leading-relaxed">{SEED.summary}</p>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {SEED.skills.map((s) => (
                  <span key={s} className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border ${
                    ai.requiredSkillsMatched.includes(s)
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-slate-700 bg-slate-100 border-slate-200"
                  }`}>{s}</span>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-2.5">
                <span className="text-green-600 font-semibold">Green</span> = matches job requirements
              </p>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Experience</h2>
              <div className="space-y-4">
                {SEED.experience_list.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{e.company} · {e.duration}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Certifications</h2>
              <div className="space-y-2">
                {SEED.certifications.map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />{c}
                  </div>
                ))}
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
                    <button key={s} onClick={() => setStatus(s)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        status === s ? c.color + " shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                      }`}
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
              <p className="text-sm font-semibold text-slate-900">{SEED.role}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{SEED.applied}</p>
              <Link href="/employer/jobs/1/edit" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-2">
                View job posting <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
