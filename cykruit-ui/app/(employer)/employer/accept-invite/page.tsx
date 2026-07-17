"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, CheckCircle, XCircle, Loader2, Users, Building2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { apiFetch, authHeaders, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type Stage = "loading" | "confirm" | "accepting" | "success" | "error";

interface InvitePreview {
  companyName: string;
  companyLogo: string | null;
  role: string;
  expiresAt: string;
  invitedEmail: string | null;
  requiresRoleUpgrade: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  HIRING_MANAGER: "Hiring Manager",
  RECRUITER: "Recruiter",
  VIEWER: "Viewer",
};

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [stage, setStage] = useState<Stage>("loading");
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const token = searchParams.get("token") ?? "";

  // On mount: fetch preview only — do NOT accept yet
  useEffect(() => {
    if (!token) {
      setErrorMsg("No invite token found in the URL.");
      setStage("error");
      return;
    }

    async function fetchPreview() {
      try {
        const res = await apiFetch<InvitePreview>(
          `/api/employer/team/invite-preview?token=${encodeURIComponent(token)}`,
          { headers: authHeaders() },
        );
        setPreview(res.data);
        setStage("confirm");
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load invite details. The link may be invalid or expired.";
        setErrorMsg(msg);
        setStage("error");
      }
    }

    fetchPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAccept() {
    setStage("accepting");
    try {
      await apiFetch("/api/employer/team/accept-invite", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ token }),
      });
      setStage("success");
      toast({ type: "success", message: "You've joined the team!" });
      setTimeout(() => router.replace("/employer/dashboard"), 2000);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to accept invitation. Please try again.";
      setErrorMsg(msg);
      setStage("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8 text-center">

          {/* Loading preview */}
          {stage === "loading" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Loading invitation…</h1>
              <p className="text-sm text-slate-500">Verifying your invite link.</p>
            </>
          )}

          {/* Confirmation screen */}
          {stage === "confirm" && preview && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                {preview.companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.companyLogo} alt={preview.companyName} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <Building2 className="w-7 h-7 text-violet-500" />
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-1">You've been invited</h1>
              <p className="text-sm text-slate-500 mb-6">
                Join <span className="font-semibold text-slate-800">{preview.companyName}</span> as{" "}
                <span className="font-semibold text-violet-600">{ROLE_LABELS[preview.role] ?? preview.role}</span>
              </p>

              {preview.invitedEmail && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4 text-left">
                  <p className="text-xs text-slate-500 mb-0.5">Invitation sent to</p>
                  <p className="text-sm font-medium text-slate-800">{preview.invitedEmail}</p>
                </div>
              )}

              {preview.requiresRoleUpgrade && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">Account type will change</p>
                    <p className="text-xs text-amber-600">
                      Accepting this invite converts your account to an Employer account. You will no longer be able to apply to jobs as a candidate.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAccept}
                  className="w-full h-11 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 active:bg-violet-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  {preview.requiresRoleUpgrade ? "Accept & Upgrade Account" : "Accept & Join Team"}
                </button>
                <Link
                  href="/employer/dashboard"
                  className="w-full h-10 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors flex items-center justify-center"
                >
                  Decline
                </Link>
              </div>
            </>
          )}

          {/* Accepting in progress */}
          {stage === "accepting" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Joining team…</h1>
              <p className="text-sm text-slate-500">Setting up your access.</p>
            </>
          )}

          {/* Success */}
          {stage === "success" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">You're in!</h1>
              <p className="text-sm text-slate-500 mb-6">
                You've successfully joined the team. Redirecting to your dashboard…
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>Redirecting to employer dashboard</span>
              </div>
            </>
          )}

          {/* Error */}
          {stage === "error" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-rose-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Invitation failed</h1>
              <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/employer/dashboard"
                  className="w-full h-10 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors flex items-center justify-center"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/login"
                  className="w-full h-10 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors flex items-center justify-center"
                >
                  Sign in to a different account
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
