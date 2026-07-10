"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SeekerTopbar from "@/components/seeker/SeekerTopbar";
import { useToast } from "@/components/ui/Toast";
import { useModal } from "@/components/ui/Modal";
import {
  ChevronLeft, MapPin, Briefcase, Calendar, FileText,
  CheckCircle2, Eye, XCircle, Send, X, AlertCircle,
  Clock, MessageSquare,
} from "lucide-react";
import type { AppStatus, Application } from "../data";
import { SEED } from "../data";
import { apiFetch, authHeaders } from "@/lib/api";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AppStatus, {
  color: string;
  bg: string;
  icon: React.ReactNode;
  step: number;
}> = {
  Applied:        { color: "text-blue-700",   bg: "bg-blue-500",   icon: <Send className="w-4 h-4" />,         step: 1 },
  "Under Review": { color: "text-amber-700",  bg: "bg-amber-400",  icon: <Eye className="w-4 h-4" />,          step: 2 },
  Shortlisted:    { color: "text-green-700",  bg: "bg-green-500",  icon: <CheckCircle2 className="w-4 h-4" />, step: 3 },
  Rejected:       { color: "text-red-600",    bg: "bg-red-400",    icon: <XCircle className="w-4 h-4" />,      step: -1 },
  Withdrawn:      { color: "text-slate-500",  bg: "bg-slate-400",  icon: <X className="w-4 h-4" />,            step: -1 },
};

const PROGRESS_STEPS: AppStatus[] = ["Applied", "Under Review", "Shortlisted"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { openModal } = useModal();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApp() {
      try {
        const { data } = await apiFetch(`/api/seeker/applications/${id}`);
        setApp({
          id: data.id,
          role: data.job.jobTitle,
          company: data.job.employer.companyName,
          location: data.job.locationType || data.job.location || "Remote",
          type: data.job.jobType || "Full-time",
          applied: new Date(data.appliedAt).toLocaleDateString(),
          status: data.status === "APPLIED" ? "Applied"
            : data.status === "UNDER_REVIEW" ? "Under Review"
            : data.status === "SHORTLISTED" ? "Shortlisted"
            : data.status === "REJECTED" ? "Rejected"
            : data.status === "WITHDRAWN" ? "Withdrawn"
            : "Applied",
          resume: data.resume?.fileName || "Resume.pdf",
          coverNote: data.screeningAnswers ? JSON.stringify(data.screeningAnswers) : "",
          timeline: data.statusHistory?.length > 0 ? data.statusHistory.map((h: any) => ({
            date: new Date(h.changedAt).toLocaleDateString(),
            event: `Status changed to ${h.newStatus}`,
            note: h.reason || ""
          })) : [{ date: new Date(data.appliedAt).toLocaleDateString(), event: "Application submitted" }]
        });
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
        <SeekerTopbar title="Application" />
        <main className="flex-1 flex items-center justify-center p-6 text-slate-400">Loading...</main>
      </>
    );
  }

  if (!app) {
    return (
      <>
        <SeekerTopbar title="Application" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Application not found</p>
            <Link href="/applications" className="text-xs text-blue-500 hover:underline mt-1 inline-block">Back to applications</Link>
          </div>
        </main>
      </>
    );
  }

  const cfg = STATUS_CFG[app.status as AppStatus] ?? STATUS_CFG.Applied;
  const isTerminal = app.status === "Rejected" || app.status === "Withdrawn";
  const activeStep = isTerminal ? -1 : (STATUS_CFG[app.status as AppStatus]?.step ?? 1);

  async function withdraw() {
    if (!app) return;
    openModal({
      variant: "danger",
      title: "Withdraw application?",
      description: `You are about to withdraw your application for "${app.role}" at ${app.company}. This cannot be undone.`,
      confirmLabel: "Withdraw",
      onConfirm: async () => {
        try {
          await apiFetch(`/api/seeker/applications/${app.id}`, {
            method: "DELETE",
            headers: authHeaders(),
            body: JSON.stringify({ reason: "Withdrawn by user" })
          });
          setApp((prev: any) => ({
            ...prev,
            status: "Withdrawn",
            timeline: [{ date: new Date().toLocaleDateString(), event: "Application withdrawn", note: "" }, ...prev.timeline],
          }));
          toast({ type: "info", message: "Application withdrawn", description: `${app.role} at ${app.company}` });
        } catch (err: any) {
          toast({ type: "error", message: err.message });
        }
      },
    });
  }

  return (
    <>
      <SeekerTopbar title="Application Detail" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-5">

          {/* Back */}
          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Applications
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500 shrink-0">
                  {app.company[0]}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">{app.role}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">{app.company}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" /> {app.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Briefcase className="w-3 h-3" /> {app.type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" /> Applied {app.applied}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border shrink-0 ${
                app.status === "Shortlisted"    ? "text-green-700 bg-green-50 border-green-200" :
                app.status === "Under Review"   ? "text-amber-700 bg-amber-50 border-amber-200" :
                app.status === "Applied"        ? "text-blue-700 bg-blue-50 border-blue-200" :
                app.status === "Rejected"       ? "text-red-700 bg-red-50 border-red-200" :
                "text-slate-500 bg-slate-100 border-slate-200"
              }`}>
                {cfg.icon}
                {app.status}
              </div>
            </div>
          </div>

          {/* Progress tracker — only for non-terminal */}
          {!isTerminal && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Application Progress</h2>
              <div className="flex items-center gap-0">
                {PROGRESS_STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const done = activeStep >= stepNum;
                  const current = activeStep === stepNum;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all ${
                          done
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-300"
                        } ${current ? "ring-4 ring-blue-100" : ""}`}>
                          {done ? STATUS_CFG[step].icon : <span className="text-xs font-bold">{stepNum}</span>}
                        </div>
                        <span className={`text-[11px] font-medium whitespace-nowrap ${done ? "text-slate-800" : "text-slate-400"}`}>
                          {step}
                        </span>
                      </div>
                      {i < PROGRESS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${activeStep > stepNum ? "bg-blue-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terminal state banner */}
          {isTerminal && (
            <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
              app.status === "Rejected" ? "bg-red-50 border-red-100" : "bg-slate-100 border-slate-200"
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                app.status === "Rejected" ? "bg-red-100" : "bg-slate-200"
              }`}>
                {cfg.icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${app.status === "Rejected" ? "text-red-700" : "text-slate-600"}`}>
                  {app.status === "Rejected" ? "Application not progressed" : "Application withdrawn"}
                </p>
                <p className={`text-xs mt-0.5 ${app.status === "Rejected" ? "text-red-500" : "text-slate-400"}`}>
                  {app.status === "Rejected"
                    ? "The employer has decided not to move forward with your application."
                    : "You withdrew this application. You can reapply if the position is still open."}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left col — timeline + cover note */}
            <div className="lg:col-span-2 space-y-5">

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Activity Timeline</h2>
                <div className="relative pl-5">
                  <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />
                  <div className="space-y-5">
                    {app.timeline.map((ev: any, i: number) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${i === 0 ? "bg-blue-500" : "bg-slate-300"}`} />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{ev.event}</p>
                            {ev.note && (
                              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                                {ev.note}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">{ev.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover note */}
              {app.coverNote && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cover Note</h2>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{app.coverNote}</p>
                </div>
              )}
            </div>

            {/* Right col — details + actions */}
            <div className="lg:col-span-1 sticky top-6 self-start">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Details</h2>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Resume used</p>
                      <p className="text-xs font-semibold text-slate-800">{app.resume}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Date applied</p>
                      <p className="text-xs font-semibold text-slate-800">{app.applied}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Last update</p>
                      <p className="text-xs font-semibold text-slate-800">
                        {app.timeline[app.timeline.length - 1].date}
                      </p>
                    </div>
                  </div>
                </div>

                {!isTerminal && (
                  <>
                    <div className="border-t border-slate-100 pt-1" />
                    <button
                      onClick={withdraw}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Withdraw Application
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
