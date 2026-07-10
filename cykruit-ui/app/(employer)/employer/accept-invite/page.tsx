"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { apiFetch, authHeaders, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type Status = "loading" | "success" | "error";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg("No invite token found in the URL.");
      setStatus("error");
      return;
    }

    async function accept() {
      try {
        await apiFetch("/api/employer/team/accept-invite", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ token }),
        });
        setStatus("success");
        toast({ type: "success", message: "You've joined the team!" });
        setTimeout(() => router.replace("/employer/dashboard"), 2000);
      } catch (err: any) {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to accept invitation. Please try again.";
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    accept();
  }, [searchParams, router, toast]);

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
          {status === "loading" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Accepting invitation…</h1>
              <p className="text-sm text-slate-500">Please wait while we verify your invite token.</p>
            </>
          )}

          {status === "success" && (
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

          {status === "error" && (
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
