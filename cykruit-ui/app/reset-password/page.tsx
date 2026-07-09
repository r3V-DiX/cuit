"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get("token") ?? "";

  const [tokenValid, setTokenValid] = useState<"checking" | "valid" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid("invalid");
      return;
    }
    apiFetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then(() => setTokenValid("valid"))
      .catch(() => setTokenValid("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast({ type: "error", message: "Password must be at least 8 characters" });
      return;
    }
    if (password !== confirm) {
      toast({ type: "error", message: "Passwords don't match" });
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ token, newPassword: password }),
      });
      setDone(true);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Verifying link…</p>
      </div>
    );
  }

  if (tokenValid === "invalid") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Link expired</h1>
          <p className="text-sm text-slate-500 mt-2">This reset link is invalid or has expired.</p>
        </div>
        <Link
          href="/forgot-password"
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          Request new link <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <div className="w-14 h-14 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Password updated</h1>
          <p className="text-sm text-slate-500 mt-2">You can now sign in with your new password.</p>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          Sign in <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Set new password</h1>
        <p className="text-sm text-slate-500 mt-1.5">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono text-slate-400 tracking-widest uppercase mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full h-11 px-4 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-slate-400 tracking-widest uppercase mb-1.5">Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Update password <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          }>
            <ResetPasswordContent />
          </Suspense>
        </div>

      </div>
    </div>
  );
}
