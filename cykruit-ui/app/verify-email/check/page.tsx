"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";

function CheckEmailContent() {
  const [resending, setResending] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/auth/check-verification?email=${encodeURIComponent(email)}`);
        if (data.isVerified) {
          clearInterval(interval);
          toast({ type: "success", message: "Email verified successfully!", description: "Please sign in to continue." });
          router.push("/login?verified=true");
        }
      } catch (err) {
        // Ignore errors during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [email, router, toast]);

  async function resend() {
    if (!email) {
      toast({ type: "error", message: "Email address not found" });
      return;
    }

    setResending(true);
    try {
      const data = await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email }),
      });

      const body = data?.data ?? data;
      const msg: string = data?.message ?? body?.message ?? "";
      if (body?.alreadyVerified || msg.toLowerCase().includes("already verified")) {
        toast({ type: "info", message: "Already verified", description: "Your email is already verified. Redirecting to sign in…" });
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      toast({ type: "success", message: "Verification email resent", description: "Check your inbox and spam folder" });
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Something went wrong" });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Circuit lines */}
      <svg className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-25" viewBox="0 0 260 260" fill="none">
        <path d="M260 50 L200 50 L200 10 L120 10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M260 130 L190 130 L190 80 L100 80" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="200" cy="50" r="3" fill="#3B82F6"/>
        <circle cx="190" cy="130" r="3" fill="#2563EB"/>
      </svg>

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-400/30 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-400/30 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-400/30 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-400/30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
              <Mail className="w-7 h-7 text-blue-600" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            We've sent a verification link to your email address. Click the link to activate your account.
          </p>

          {/* Steps hint */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-left space-y-3">
            {[
              "Open the email from Cykruit",
              "Click the \"Verify Email\" button",
              "You'll be redirected back automatically",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-slate-600">{step}</span>
              </div>
            ))}
          </div>

          {/* Resend */}
          <p className="text-xs text-slate-400 mt-6">Didn't receive it?</p>
          <button
            onClick={resend}
            disabled={resending}
            className="mt-2 flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Sending…" : "Resend verification email"}
          </button>

          <p className="text-xs text-slate-400 mt-5">
            Wrong email?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Go back and register again
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 font-mono">
          Verification links expire after 24 hours
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}
