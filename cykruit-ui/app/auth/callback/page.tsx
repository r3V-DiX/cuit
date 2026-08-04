"use client";

import { useEffect, useState, useRef, Suspense } from "react";
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          // The `domain_match`/`company` query params alone must not decide the
          // flow — they must be reconciled with the user's CURRENT role and join
          // request state. Otherwise a returning SEEKER who already chose
          // "continue as seeker" can revisit this URL, be re-offered the employer
          // join, and end up as EMPLOYER — bypassing the role lock the screen
          // promises. The backend also rejects re-requests (see requestToJoin).
          if (role === "EMPLOYER") {
            // Already a member — this decision is locked. Route to the employer app.
            if (isNewUser) {
              toast({ type: "success", message: "Account created!" });
            }
            const es = data?.employerStatus as { hasProfile?: boolean; needsVerification?: boolean } | undefined;
            if (!es?.hasProfile || es?.needsVerification) {
              router.push("/kyc/employer");
              return;
            }
            router.push("/employer/dashboard");
            return;
          }

          // SEEKER — check whether they already made a decision before re-offering.
          const jr = await apiFetch<{ status?: string } | null>(
            "/api/employer/company/join-request/me",
          ).catch(() => null);
          const reqStatus = jr?.data?.status;

          if (reqStatus === "PENDING") {
            // Request already in flight — show the waiting screen, not a re-request.
            setScreen("join-requested");
            return;
          }
          if (reqStatus === "ACCEPTED") {
            // Accepted while the session was stale — force a role-upgraded relogin.
            toast({ type: "info", message: "Your join request was approved", description: "Please log in again to access your employer dashboard." });
            router.push("/login?reason=role_upgraded");
            return;
          }
          if (reqStatus === "REJECTED") {
            // They already chose the seeker path (or were declined) — role is locked.
            toast({ type: "info", message: "Continuing as a job seeker" });
            router.push("/dashboard");
            return;
          }

          // No prior request (or it expired) — legitimate fresh choice.
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
          // Check if this SEEKER had a join request accepted while they were away.
          // Their sessions were revoked on accept so they re-logged in as SEEKER —
          // this shouldn't happen, but guard against it just in case.
          const jr = await apiFetch<{ status?: string } | null>(
            "/api/employer/company/join-request/me",
          ).catch(() => null);
          if (jr?.data?.status === "ACCEPTED") {
            toast({ type: "info", message: "Your join request was approved", description: "Please log in again to access your employer dashboard." });
            router.push("/login?reason=role_upgraded");
            return;
          }
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

  useEffect(() => {
    if (screen !== "join-requested") {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch<{ status?: string } | null>("/api/employer/company/join-request/me");
        const status = res?.data?.status;
        if (status === "ACCEPTED") {
          clearInterval(pollRef.current!); pollRef.current = null;
          toast({ type: "success", message: "Request approved!", description: "Please log in again to access your employer dashboard." });
          router.push("/login?reason=role_upgraded");
        } else if (status === "REJECTED") {
          clearInterval(pollRef.current!); pollRef.current = null;
          toast({ type: "error", message: "Request declined", description: "Your join request was not approved. You can continue as a job seeker." });
          router.push("/dashboard");
        } else if (status === "EXPIRED") {
          clearInterval(pollRef.current!); pollRef.current = null;
          toast({ type: "error", message: "Request expired", description: "Your join request was not reviewed in time. Continue as a job seeker." });
          router.push("/dashboard");
        }
      } catch {
        // network hiccup — retry next tick
      }
    }, 10000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

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
                Your email domain is associated with this company. Choose one path — this decision locks in your role.
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Join as Employer</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Once the owner approves your request, your account becomes an Employer account. You'll no longer be able to apply to jobs as a candidate.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestToJoin}
                    disabled={loading}
                    className="w-full h-10 rounded-lg bg-linear-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold hover:from-violet-400 hover:to-violet-500 shadow-sm shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Request to join {matchedCompany} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Continue as Job Seeker</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        You'll browse and apply to jobs as a candidate. To join this company later, a team member must send you a direct invite.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchToSeeker}
                    disabled={loading}
                    className="w-full h-10 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white hover:border-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue as job seeker
                  </button>
                </div>
              </div>
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

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-1">
                <p className="text-xs font-semibold text-amber-800">What happens next?</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The team owner will receive a notification. Once approved, your role becomes Employer and you'll be asked to log in again.
                </p>
              </div>

              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={handleSwitchToSeeker}
                  disabled={loading}
                  className="text-xs text-rose-500 hover:text-rose-600 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Cancel my request and continue as job seeker"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
