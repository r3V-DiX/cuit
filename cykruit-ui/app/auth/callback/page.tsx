"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Shield } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function completeAuth() {
      try {
        const { data } = await apiFetch("/api/auth/me");
        const role = data?.role;
        toast({ type: "success", message: "Signed in successfully" });
        if (role === "EMPLOYER") {
          router.push("/employer/dashboard");
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        if (err instanceof ApiError) {
          toast({ type: "error", message: "Authentication failed", description: "Could not retrieve user session." });
        } else {
          toast({ type: "error", message: "Authentication error", description: "Something went wrong during sign in." });
        }
        router.push("/login");
      }
    }
    completeAuth();
  }, [router, toast]);

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
