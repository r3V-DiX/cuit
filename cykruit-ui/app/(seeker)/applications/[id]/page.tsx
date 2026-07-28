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
  Clock, MessageSquare, ExternalLink, Quote,
} from "lucide-react";
import { ApplicationDetailSkeleton } from "@/components/ui/skeletons/PageSkeletons";
import type { AppStatus, Application } from "../data";
import { SEED } from "../data";
import { apiFetch, authHeaders } from "@/lib/api";

function formatEnum(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

// ─── Timeline dot color by event type ─────────────────────────────────────────

function timelineDotClass(event: string, index: number): string {
  if (index === 0) return "bg-blue-500 w-3.5 h-3.5 ring-4 ring-blue-100";
  if (/reject/i.test(event)) return "bg-red-400 w-2.5 h-2.5";
  if (/shortlist/i.test(event)) return "bg-green-500 w-2.5 h-2.5";
  if (/review/i.test(event)) return "bg-amber-400 w-2.5 h-2.5";
  if (/withdraw/i.test(event)) return "bg-slate-400 w-2.5 h-2.5";
  return "bg-slate-300 w-2.5 h-2.5";
}

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
        const { data } = await apiFetch<any>(`/api/seeker/applications/${id}`);
        setApp({
          id: data.id,
          jobId: data.job.id,
          role: data.job.jobTitle,
          company: data.job.employer?.companyName || "Unknown",
          location: data.job.location?.displayName || "Remote",
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
            event: `Status changed to ${formatEnum(h.newStatus)}`,
            note: h.reason || ""
          })) : [{ date: new Date(data.appliedAt).toLocaleDateString(), event: "Application submitted" }]
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error(err);
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <ApplicationDetailSkeleton />
        </main>
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
      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="space-y-5">

          {/* Back */}
          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Applications
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
              {/* Company avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center text-2xl font-extrabold text-blue-600 shrink-0 shadow-sm">
                {app.company[0]}
              </div>

              {/* Role + meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{app.role}</h1>
                <p className="text-sm text-slate-500 mt-0.5 font-medium">{app.company}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {app.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                    <Briefcase className="w-3 h-3 text-slate-400" /> {formatEnum(app.type)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Applied {app.applied}
                  </span>
                </div>
              </div>

              {/* Status + View Job */}
              <div className="flex flex-col items-end gap-2.5 shrink-0 self-start">
                <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-xl border ${
                  app.status === "Shortlisted"  ? "text-green-700 bg-green-50 border-green-200" :
                  app.status === "Under Review" ? "text-amber-700 bg-amber-50 border-amber-200" :
                  app.status === "Applied"      ? "text-blue-700 bg-blue-50 border-blue-200" :
                  app.status === "Rejected"     ? "text-red-700 bg-red-50 border-red-200" :
                  "text-slate-500 bg-slate-100 border-slate-200"
                }`}>
                  {cfg.icon}
                  {app.status}
                </div>
                {app.jobId && (
                  <Link
                    href={`/jobs/${app.jobId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Job
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Progress tracker — only for non-terminal */}
          {!isTerminal && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Application Progress</h2>
              <div className="flex items-center gap-0">
                {PROGRESS_STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const done = activeStep >= stepNum;
                  const current = activeStep === stepNum;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                          done
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                            : "bg-slate-50 border-slate-200 text-slate-300"
                        } ${current ? "ring-4 ring-blue-100" : ""}`}>
                          {done ? STATUS_CFG[step].icon : <span className="text-xs font-bold">{stepNum}</span>}
                        </div>
                        <span className={`text-[11px] font-semibold whitespace-nowrap ${done ? "text-slate-800" : "text-slate-400"}`}>
                          {step}
                        </span>
                      </div>
                      {i < PROGRESS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-6 rounded-full transition-all ${activeStep > stepNum ? "bg-blue-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terminal state banner */}
          {isTerminal && (
            <div className={`rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${
              app.status === "Rejected" ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-200"
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                app.status === "Rejected" ? "bg-red-100 text-red-500" : "bg-slate-200 text-slate-500"
              }`}>
                <span className="[&>svg]:w-6 [&>svg]:h-6">{cfg.icon}</span>
              </div>
              <div>
                <p className={`text-base font-bold ${app.status === "Rejected" ? "text-red-700" : "text-slate-700"}`}>
                  {app.status === "Rejected" ? "Application not progressed" : "Application withdrawn"}
                </p>
                <p className={`text-sm mt-0.5 leading-relaxed ${app.status === "Rejected" ? "text-red-500" : "text-slate-500"}`}>
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Activity Timeline</h2>
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-6">
                    {app.timeline.map((ev: any, i: number) => (
                      <div key={i} className="relative flex items-start gap-4">
                        <div className={`absolute -left-[22px] top-1 rounded-full border-2 border-white shrink-0 ${timelineDotClass(ev.event, i)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-snug">{ev.event}</p>
                          {ev.note && (
                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                              {ev.note}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 shrink-0 mt-0.5 whitespace-nowrap">
                          {ev.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover note */}
              {app.coverNote && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Quote className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cover Note</h2>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed pl-1 border-l-2 border-slate-200 ml-1">
                    {app.coverNote}
                  </p>
                </div>
              )}
            </div>

            {/* Right col — details + actions */}
            <div className="lg:col-span-1 sticky top-6 self-start">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Details</h2>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Resume used</p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{app.resume}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Date applied</p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{app.applied}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Last update</p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{app.timeline[0].date}</p>
                    </div>
                  </div>
                </div>

                {!isTerminal && (
                  <>
                    <div className="border-t border-slate-100 pt-1" />
                    <button
                      onClick={withdraw}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
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
