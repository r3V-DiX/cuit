"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Shield, Building2, ArrowRight, Clock, Loader2, Users } from "lucide-react";
import { apiFetch, ApiError, authHeaders } from "@/lib/api";
import { broadcastLogin } from "@/lib/auth-sync";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}

type Screen = "loading" | "domain-found" | "join-requested" | "redirecting";

function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "1";
  const hasDomainMatch = searchParams.get("domain_match") === "1";
  const matchedCompany = searchParams.get("company") ?? "";

  const [screen, setScreen] = useState<Screen>("loading");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function completeAuth() {
      try {
        const { data } = await apiFetch<{ role?: string; employerStatus?: { hasProfile?: boolean; needsVerification?: boolean } }>(
          "/api/auth/me",
          { skipAuthRedirect: true },
        );
        const role = data?.role;
        broadcastLogin(role === "EMPLOYER" ? "EMPLOYER" : "SEEKER");

        if (hasDomainMatch && matchedCompany) {
          if (isNewUser) {
            toast({ type: "success", message: "Account created!" });
          }
          setScreen("domain-found");
          return;
        }

        if (isNewUser) {
          toast({ type: "success", message: "Account created! Complete your profile to get started." });
          router.push(role === "EMPLOYER" ? "/kyc/employer" : "/dashboard");
          return;
        }

        toast({ type: "success", message: "Signed in successfully" });
        if (role === "EMPLOYER") {
          const es = data?.employerStatus as { hasProfile?: boolean; needsVerification?: boolean } | undefined;
          if (!es?.hasProfile || es?.needsVerification) {
            router.push("/kyc/employer");
            return;
          }
          router.push("/employer/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          toast({ type: "error", message: "Authentication failed", description: "Could not retrieve user session." });
        } else {
          toast({ type: "error", message: "Authentication error", description: "Something went wrong during sign in." });
        }
        router.push("/login");
      }
    }
    completeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRequestToJoin() {
    setLoading(true);
    try {
      await apiFetch("/api/employer/company/join-request", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      setScreen("join-requested");
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      toast({ type: "error", message: apiErr?.message || "Failed to send request" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSwitchToSeeker() {
    setLoading(true);
    try {
      await apiFetch("/api/auth/switch-to-seeker", {
        method: "PATCH",
        headers: authHeaders(),
      });
      broadcastLogin("SEEKER");
      router.push("/jobs");
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      toast({ type: "error", message: apiErr?.message || "Failed to continue as seeker" });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {screen === "loading" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Completing Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">Please wait while we secure your connection...</p>
          </div>
        </div>
      )}

      {screen === "domain-found" && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-violet-100 bg-violet-50 text-violet-600 text-xs font-mono tracking-widest mb-1">
                    <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                    DOMAIN MATCH
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">Your company is here</h1>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{matchedCompany}</p>
                  <p className="text-xs text-slate-500 font-mono">Verified company</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Your email domain is already associated with this company. Request to join their team — once the owner approves, you'll have full employer access.
              </p>

              <button
                type="button"
                onClick={handleRequestToJoin}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-linear-to-r from-violet-500 to-violet-600 text-white text-base font-semibold hover:from-violet-400 hover:to-violet-500 shadow-md shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Request to join {matchedCompany} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <button
                type="button"
                onClick={handleSwitchToSeeker}
                disabled={loading}
                className="w-full h-10 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue as job seeker instead
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "join-requested" && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
            <div className="p-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-100 bg-amber-50 text-amber-600 text-xs font-mono tracking-widest mb-1">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    PENDING APPROVAL
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">Request sent!</h1>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Your request to join{" "}
                <span className="font-semibold text-slate-800">{matchedCompany}</span>{" "}
                has been sent. You'll be notified once the owner reviews it.
              </p>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs text-amber-700 leading-relaxed">
                  Once approved you'll receive a notification and can log in as an employer. Until then, you can browse jobs as a seeker.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSwitchToSeeker}
                disabled={loading}
                className="w-full h-11 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue as job seeker instead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
