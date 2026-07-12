"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Shield, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Building2, Mail, Globe, Clock,
} from "lucide-react";
import { apiFetch, authHeaders } from "@/lib/api";

interface KycDetail {
  id: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  employerId: string;
  employer: {
    id: string;
    companyName: string;
    slug: string;
    contactEmail: string;
    companyWebsite?: string | null;
    companyLogo?: string | null;
  };
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
  UNDER_REVIEW: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  APPROVED:     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REJECTED:     "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function KycDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<KycDetail | null>(null);
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
    apiFetch<KycDetail>(`/api/admin/kyc/${id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const canAct = detail?.status === "PENDING" || detail?.status === "UNDER_REVIEW";

  async function handleApprove() {
    if (!canAct) return;
    setActing(true);
    try {
      await apiFetch(`/api/admin/kyc/${id}/approve`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ adminNotes: adminNotes || undefined }),
      });
      showToast("success", "KYC approved");
      router.push("/admin/kyc");
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
      await apiFetch(`/api/admin/kyc/${id}/reject`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ rejectionReason: rejectReason.trim(), adminNotes: adminNotes || undefined }),
      });
      showToast("success", "KYC rejected");
      router.push("/admin/kyc");
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
        <p className="text-sm">KYC record not found</p>
        <button onClick={() => router.push("/admin/kyc")} className="mt-4 text-xs text-blue-400 hover:underline">← Back</button>
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
        <button onClick={() => router.push("/admin/kyc")}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> KYC Review
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{detail.id}</p>
        </div>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${STATUS_COLOR[detail.status] ?? "text-slate-400 bg-white/5 border-white/10"}`}>
        {detail.status === "APPROVED" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
        {detail.status === "REJECTED" && <XCircle className="w-5 h-5 shrink-0" />}
        {(detail.status === "PENDING" || detail.status === "UNDER_REVIEW") && <AlertTriangle className="w-5 h-5 shrink-0" />}
        <div>
          <p className="font-semibold text-sm">{detail.status.replace("_", " ")}</p>
          {detail.rejectionReason && <p className="text-xs mt-0.5 opacity-80">Reason: {detail.rejectionReason}</p>}
        </div>
      </div>

      {/* Company info */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5 space-y-4">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Company</p>
        <div className="flex items-center gap-4">
          {detail.employer.companyLogo ? (
            <img src={detail.employer.companyLogo} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-500" />
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{detail.employer.companyName}</p>
            <p className="text-slate-500 text-xs font-mono">/{detail.employer.slug}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span className="font-mono">{detail.employer.contactEmail}</span>
          </div>
          {detail.employer.companyWebsite && (
            <div className="flex items-center gap-2 text-slate-400">
              <Globe className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <a href={detail.employer.companyWebsite} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-mono truncate">
                {detail.employer.companyWebsite}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
            <span>Submitted {fmt(detail.submittedAt)}</span>
          </div>
          {detail.reviewedAt && (
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span>Reviewed {fmt(detail.reviewedAt)}</span>
            </div>
          )}
        </div>
        {detail.adminNotes && (
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Admin Notes</p>
            <p className="text-slate-300 text-xs">{detail.adminNotes}</p>
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
              placeholder="Internal notes visible only to admins…"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {!showReject ? (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={acting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                {acting ? "Approving…" : "Approve KYC"}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={acting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-sm font-medium transition-all disabled:opacity-40"
              >
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
                  placeholder="Explain why the KYC is being rejected…"
                  className="w-full px-3 py-2 bg-white/5 border border-rose-500/20 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={acting || !rejectReason.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  {acting ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button
                  onClick={() => { setShowReject(false); setRejectReason(""); }}
                  className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-all"
                >
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
