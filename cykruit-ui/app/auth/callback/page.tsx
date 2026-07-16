"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Shield, Building2, X, ArrowRight } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { broadcastLogin } from "@/lib/auth-sync";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}

function DomainMatchBanner({ companyName, onDismiss }: { companyName: string; onDismiss: () => void }) {
  return (
    <div className="w-full max-w-md mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm shadow-blue-100/50">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-0.5 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="pr-4">
            <p className="text-sm font-semibold text-blue-900 leading-snug">
              {companyName} is already on Cykruit
            </p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              You&apos;ve been signed in as a Job Seeker. To join your company&apos;s employer account,
              ask your team admin for an invite link.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors"
            >
              Continue to dashboard <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "1";
  const hasDomainMatch = searchParams.get("domain_match") === "1";
  const matchedCompany = searchParams.get("company") ?? "";

  const [showBanner, setShowBanner] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function completeAuth() {
      try {
        const { data } = await apiFetch<{ role?: string; employerStatus?: { hasProfile?: boolean; needsVerification?: boolean } }>("/api/auth/me", { skipAuthRedirect: true });
        const role = data?.role;
        broadcastLogin(role === "EMPLOYER" ? "EMPLOYER" : "SEEKER");

        if (hasDomainMatch && matchedCompany) {
          if (isNewUser) {
            toast({ type: "success", message: "Account created! Complete your profile to get started." });
          }
          setReady(true);
          setShowBanner(true);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {showBanner && matchedCompany ? (
        <DomainMatchBanner
          companyName={matchedCompany}
          onDismiss={() => router.push("/dashboard")}
        />
      ) : null}

      {!ready ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Completing Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">Please wait while we secure your connection...</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
