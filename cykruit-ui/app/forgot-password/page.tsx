"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, ChevronLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, ApiError, authHeaders } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast({ type: "error", message: "Email is required" });
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success to avoid email enumeration
      setSent(true);
    } catch (err: any) {
      // Always show success to avoid email enumeration
      if (err instanceof ApiError && err.status === 404) {
        setSent(true);
      } else {
        toast({ type: "error", message: err.message || "Something went wrong" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-wider font-mono">CYKRUIT</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Check your email</h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  If <span className="font-semibold text-slate-700">{email}</span> is registered, you'll receive a reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Reset password</h1>
                <p className="text-sm text-slate-500 mt-1.5">Enter your email and we'll send a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 tracking-widest uppercase mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoFocus
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
