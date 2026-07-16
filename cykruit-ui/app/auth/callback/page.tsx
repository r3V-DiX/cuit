"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Shield } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { broadcastLogin } from "@/lib/auth-sync";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallback />
    </Suspense>
  );
}

function AuthCallback() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "1";

  useEffect(() => {
    async function completeAuth() {
      try {
        const { data } = await apiFetch<{ role?: string; employerStatus?: { hasProfile?: boolean; needsVerification?: boolean } }>("/api/auth/me");
        const role = data?.role;
        broadcastLogin(role === "EMPLOYER" ? "EMPLOYER" : "SEEKER");

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
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 animate-pulse">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800">Completing Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">Please wait while we secure your connection...</p>
        </div>
      </div>
    </div>
  );
}
