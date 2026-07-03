"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

type Status = "verifying" | "success" | "failed";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("verifying");

  // Simulate token verification on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mock: always succeeds. Real impl reads `?token=` from URL and hits API.
      setStatus("success");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8 text-center">

          {/* Verifying */}
          {status === "verifying" && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Verifying your email…</h1>
              <p className="text-sm text-slate-500 mt-2">Please wait while we confirm your email address.</p>
              <div className="mt-6 flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Email verified!</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Your email address has been confirmed. You can now sign in to your account.
              </p>

              <div className="mt-6 space-y-2.5">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}

          {/* Failed */}
          {status === "failed" && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-rose-600" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Verification failed</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                This link is invalid or has expired. Verification links are only valid for 24 hours.
              </p>

              <div className="mt-6 space-y-2.5">
                <Link
                  href="/verify-email/check"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
                >
                  Resend verification email <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full h-11 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 font-mono">
          Having trouble?{" "}
          <Link href="/about" className="text-blue-500 hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
