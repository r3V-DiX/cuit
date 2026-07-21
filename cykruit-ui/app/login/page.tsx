"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ArrowRight, ChevronLeft, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, authHeaders, ApiError } from "@/lib/api";
import { broadcastLogin } from "@/lib/auth-sync";

// ── Background decorations (reused) ──────────────────────────────────────────

function PageBackground() {
  return (
    <>
      {/* grid rendered by server layout.tsx */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-80 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />
      <svg className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-30" viewBox="0 0 260 260" fill="none">
        <path d="M260 50 L200 50 L200 10 L120 10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M260 130 L190 130 L190 80 L100 80" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="200" cy="50" r="3" fill="#3B82F6"/>
        <circle cx="190" cy="130" r="3" fill="#06B6D4"/>
      </svg>
      <svg className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none opacity-20" viewBox="0 0 260 260" fill="none">
        <path d="M0 200 L60 200 L60 240 L140 240" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"/>
        <path d="M0 130 L70 130 L70 180 L160 180" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3"/>
        <circle cx="60" cy="200" r="3" fill="#3B82F6"/>
        <circle cx="70" cy="130" r="3" fill="#06B6D4"/>
      </svg>
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-blue-200 pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-blue-200 pointer-events-none" />
      <div className="absolute top-[26%] right-[12%] pointer-events-none opacity-25 font-mono text-xs text-blue-500 space-y-1 leading-tight">
        <div>&gt; AUTH_INIT...</div>
        <div>SESSION: 0xb2e9</div>
        <div>STATUS: OK</div>
      </div>
    </>
  );
}

// ── OTP digit input ──────────────────────────────────────────────────────────

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const newOtp = value.slice(0, i) + digit + value.slice(i + 1);
    onChange(newOtp.slice(0, 6));
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "Enter" && value.length === 6) {
      (e.target as HTMLInputElement).form?.requestSubmit();
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleFocus(i: number) {
    const nextEmpty = value.length;
    if (i > nextEmpty) refs.current[nextEmpty]?.focus();
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={2}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          disabled={disabled}
          autoFocus={i === 0}
          className={`w-11 h-13 rounded-xl border-2 text-center text-xl font-bold font-mono transition-all focus:outline-none ${
            value.length === i
              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-200"
              : value[i]
              ? "border-slate-300 bg-white text-slate-900"
              : "border-slate-200 bg-slate-50 text-slate-900"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

function LoginForm() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "";

  // Show OAuth error redirected back from backend (e.g. ?error=GOOGLE_AUTH_FAILED)
  const OAUTH_ERROR_MESSAGES: Record<string, string> = {
    GOOGLE_AUTH_FAILED:    "Google sign-in failed. Please try again.",
    OAUTH_INVALID_ROLE:    "Sign-in failed. Please try again.",
    INVALID_OAUTH_STATE:   "Sign-in session expired. Please try again.",
    GOOGLE_TOKEN_INVALID:  "Google returned an invalid token. Please try again.",
    OAUTH_EMAIL_MISSING:   "Google did not share your email. Enable email access and retry.",
    OAUTH_ACCOUNT_CONFLICT: "An account with this email already exists with a different sign-in method.",
  };
  useEffect(() => {
    const errCode = searchParams.get("error");
    if (errCode) {
      toast({
        type: "error",
        message: OAUTH_ERROR_MESSAGES[errCode] ?? "Sign-in failed. Please try again.",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast({ type: "error", message: "Email is required" }); return; }
    setLoading(true);
    try {
      await apiFetch("/api/auth/request-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim().toLowerCase(), flow: "login" }),
      });
      setStep("otp");
      startResendCooldown();
      toast({ type: "success", message: "OTP sent", description: "Check your inbox for a 6-digit code." });
    } catch (err: any) {
      if (err instanceof ApiError && (err.code === "ACCOUNT_NOT_FOUND" || err.code === "REGISTRATION_INCOMPLETE")) {
        toast({ type: "error", message: err.message });
        router.push("/register");
        return;
      }
      if (err instanceof ApiError && err.code === "ROLE_MISMATCH") {
        toast({ type: "error", message: err.message });
        return;
      }
      toast({ type: "error", message: err.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { toast({ type: "error", message: "Enter the 6-digit OTP" }); return; }
    setLoading(true);
    try {
      const result = await apiFetch<{ role?: string }>("/api/auth/verify-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp, rememberMe: true }),
        skipLogoutOn401: true,
      });
      const userRole = result.data?.role;
      broadcastLogin(userRole === "EMPLOYER" ? "EMPLOYER" : "SEEKER");
      const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
      if (userRole === "EMPLOYER") {
        router.push(safeNext && safeNext.startsWith("/employer") ? safeNext : "/employer/dashboard");
        return;
      }
      router.push(safeNext && !safeNext.startsWith("/employer") ? safeNext : "/dashboard");
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Invalid OTP" });
      if (err.code === "OTP_MAX_ATTEMPTS") {
        setStep("email");
        setOtp("");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  function startResendCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await apiFetch("/api/auth/request-otp", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: email.trim().toLowerCase(), flow: "login" }),
      });
      setOtp("");
      startResendCooldown();
      toast({ type: "success", message: "New OTP sent" });
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const result = await apiFetch<{ url?: string }>("/api/auth/google");
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast({ type: "error", message: "Failed to get Google sign-in URL" });
      }
    } catch {
      toast({ type: "error", message: "Failed to connect to authentication server" });
    }
  }

  return (
    <>
      <PageBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => step === "otp" ? (setStep("email"), setOtp("")) : router.back()}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-600 transition-colors tracking-widest cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {step === "otp" ? "CHANGE EMAIL" : "BACK"}
          </button>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Cykruit</span>
          </Link>
          <div className="w-24" />
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-blue-100 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-blue-100 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-blue-100 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-blue-100 pointer-events-none" />

          <div className="p-8">
            {step === "email" ? (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-xs font-mono tracking-widest mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    AUTH.OTP
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-mono text-green-400">auth.otp()</span>
                    </div>
                  </div>
                  <p className="text-base text-slate-500">Enter your email and we&apos;ll send you a sign-in code.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSendOtp}>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 tracking-widest mb-1.5 uppercase">Email</label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-mono"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 text-white text-base font-semibold hover:from-blue-400 hover:to-blue-500 shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send OTP
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-xs font-mono text-slate-400 tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full h-11 rounded-xl bg-white border border-slate-200 text-slate-700 text-base font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-xs text-slate-400 mt-2.5 px-2">
                  Google sign-in creates a Job Seeker account.{" "}
                  <span className="text-slate-500">Employers:</span> use email above or ask your admin for an invite link.
                </p>

                <p className="text-center text-sm text-slate-500 mt-4">
                  New here?{" "}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    Create an account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-xs font-mono tracking-widest mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    AUTH.VERIFY
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Check your inbox</h1>
                  <p className="text-base text-slate-500">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-slate-700 font-mono">{email}</span>
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 tracking-widest mb-3 uppercase">Enter OTP</label>
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-11 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 text-white text-base font-semibold hover:from-blue-400 hover:to-blue-500 shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <>
                        Verify & Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                  OTP expires in 10 minutes · Didn&apos;t get it? Check spam or resend.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs font-mono text-slate-400 tracking-widest">VERIFIED · SECURE · ENCRYPTED</span>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
