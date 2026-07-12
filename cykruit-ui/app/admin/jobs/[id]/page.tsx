"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Briefcase, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Building2, Clock,
} from "lucide-react";
import DOMPurify from "dompurify";
import { apiFetch, authHeaders } from "@/lib/api";

interface JobDetail {
  id: string;
  jobTitle: string;
  status: string;
  description: string | null;
  createdAt: string;
  rejectionReason: string | null;
  employer: {
    id: string;
    companyName: string;
    slug: string;
    isVerified: boolean;
    companyLogo?: string | null;
  };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  APPROVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REJECTED: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  DRAFT:    "text-slate-400 bg-slate-500/10 border-slate-500/20",
  CLOSED:   "text-slate-500 bg-slate-500/10 border-slate-500/20",
  EXPIRED:  "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function SafeHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: ["p","br","ul","ol","li","strong","em","h1","h2","h3","h4","a","code","pre"], ALLOWED_ATTR: [] });
    }
  }, [html]);
  return <div ref={ref} className="prose prose-invert prose-sm max-w-none text-slate-300" />;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    apiFetch<JobDetail>(`/api/admin/jobs/${id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const canAct = detail?.status === "PENDING";

  async function handleApprove() {
    if (!canAct) return;
    setActing(true);
    try {
      await apiFetch(`/api/admin/jobs/${id}/approve`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ adminNotes: adminNotes || undefined }),
      });
      showToast("success", "Job approved");
      router.push("/admin/jobs");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!canAct || !rejectReason.trim()) return;
    setActing(true);
    try {
      await apiFetch(`/api/admin/jobs/${id}/reject`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ reason: rejectReason.trim(), adminNotes: adminNotes || undefined }),
      });
      showToast("success", "Job rejected");
      router.push("/admin/jobs");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 text-center text-slate-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Job not found</p>
        <button onClick={() => router.push("/admin/jobs")} className="mt-4 text-xs text-blue-400 hover:underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${toast.type === "success" ? "bg-emerald-950 border-emerald-500/30 text-emerald-300" : "bg-rose-950 border-rose-500/30 text-rose-300"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/jobs")}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-violet-400" /> Job Review
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{detail.id}</p>
        </div>
      </div>

      <div className={`flex items-center gap-3 p-4 rounded-xl border ${STATUS_COLOR[detail.status] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
        {detail.status === "APPROVED" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
        {detail.status === "REJECTED" && <XCircle className="w-5 h-5 shrink-0" />}
        {detail.status === "PENDING" && <AlertTriangle className="w-5 h-5 shrink-0" />}
        <div>
          <p className="font-semibold text-sm">{detail.status}</p>
          {detail.rejectionReason && <p className="text-xs mt-0.5 opacity-80">Reason: {detail.rejectionReason}</p>}
        </div>
      </div>

      {/* Job info */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Job Details</p>
        <div>
          <h2 className="text-white font-semibold text-base">{detail.jobTitle}</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              {detail.employer.companyLogo ? (
                <img src={detail.employer.companyLogo} alt="" className="w-5 h-5 rounded object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-slate-400 text-xs">{detail.employer.companyName}</span>
              {detail.employer.isVerified && <span title="KYC verified"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></span>}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Clock className="w-3 h-3" />
              <span>{fmt(detail.createdAt)}</span>
            </div>
          </div>
        </div>

        {detail.description && (
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-2">Description</p>
            <div className="bg-white/5 rounded-lg p-4 max-h-80 overflow-y-auto">
              <SafeHtml html={detail.description} />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {canAct && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Review Decision</p>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Admin Notes (optional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes…"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {!showReject ? (
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={acting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-40">
                <CheckCircle2 className="w-4 h-4" />
                {acting ? "Approving…" : "Approve Job"}
              </button>
              <button onClick={() => setShowReject(true)} disabled={acting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-sm font-medium transition-all disabled:opacity-40">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Rejection reason <span className="text-rose-400">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this job is being rejected…"
                  className="w-full px-3 py-2 bg-white/5 border border-rose-500/20 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleReject} disabled={acting || !rejectReason.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all disabled:opacity-40">
                  <XCircle className="w-4 h-4" />
                  {acting ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button onClick={() => { setShowReject(false); setRejectReason(""); }}
                  className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
