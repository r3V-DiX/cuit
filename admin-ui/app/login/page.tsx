'use client';

// admin-ui/app/login/page.tsx

// Admin-only login page. Adapted from cykruit-ui's light-theme login.
// NO registration, NO OAuth, NO role toggle.
//
// Flow:
//  1. POST /api/admin/auth/login
//  2. GET /api/admin/me — resolved RBAC context (stored in sessionStorage for (admin)/layout)
//  3. router.replace(redirect ?? '/dashboard')

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle, Activity } from 'lucide-react';



function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Terminal typing effect
  const phrases = [
    'INITIALIZING ADMIN SESSION...',
    'VERIFYING CREDENTIALS...',
    'LOADING PERMISSION MATRIX...',
    'CONNECTING TO ADMIN CONSOLE...',
    'AUTHENTICATION READY...',
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const phrase = phrases[phraseIdx];
    if (charIdx <= phrase.length) {
      timeoutRef.current = setTimeout(() => {
        setTyped(phrase.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, 55);
    } else {
      timeoutRef.current = setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % phrases.length);
        setCharIdx(0);
      }, 2200);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charIdx, phraseIdx]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1 — Login
      const loginRes = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginBody = (await loginRes.json()) as {
        success: boolean;
        error?: { message?: string };
        message?: string;
      };
      if (!loginRes.ok || !loginBody.success) {
        setError(
          loginBody.error?.message ?? loginBody.message ?? 'Invalid credentials.',
        );
        return;
      }

      // Step 2 — Load RBAC permissions into sessionStorage for (admin)/layout
      try {
        const adminMeRes = await fetch('/api/admin/me');
        if (adminMeRes.ok) {
          const adminMeBody = (await adminMeRes.json()) as {
            success: boolean;
            data?: unknown;
          };
          if (adminMeBody.success && adminMeBody.data) {
            sessionStorage.setItem(
              'admin_permissions',
              JSON.stringify(adminMeBody.data),
            );
          }
        }
      } catch {
        // Non-fatal — (admin)/layout will refetch
      }

      // Step 3 — Navigate
      router.replace(redirect ?? '/dashboard');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Glow blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      {/* Circuit lines — top right */}
      <svg
        className="pointer-events-none absolute top-0 right-0 h-72 w-72 opacity-25"
        viewBox="0 0 260 260"
        fill="none"
      >
        <path d="M260 50 L200 50 L200 10 L120 10" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M260 130 L190 130 L190 80 L100 80" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="200" cy="50" r="3" fill="#3B82F6" />
        <circle cx="190" cy="130" r="3" fill="#06B6D4" />
        <circle cx="120" cy="10" r="3" fill="#3B82F6" />
      </svg>

      {/* Circuit lines — bottom left */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 opacity-20"
        viewBox="0 0 260 260"
        fill="none"
      >
        <path d="M0 200 L60 200 L60 240 L140 240" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M0 130 L70 130 L70 180 L160 180" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="60" cy="200" r="3" fill="#3B82F6" />
        <circle cx="70" cy="130" r="3" fill="#06B6D4" />
      </svg>

      {/* Corner brackets */}
      <div className="pointer-events-none absolute top-6 left-6 h-8 w-8 border-t-2 border-l-2 border-blue-200" />
      <div className="pointer-events-none absolute top-6 right-6 h-8 w-8 border-t-2 border-r-2 border-blue-200" />
      <div className="pointer-events-none absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-blue-200" />
      <div className="pointer-events-none absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-blue-200" />

      {/* Decorative shields */}
      <svg className="pointer-events-none absolute top-[13%] right-[10%] h-16 w-16 opacity-10" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
      </svg>
      <svg className="pointer-events-none absolute bottom-[28%] left-[7%] h-20 w-20 opacity-8" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="0.8">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
      </svg>

      {/* Dot clusters */}
      <div className="pointer-events-none absolute right-[2%] top-[45%] grid grid-cols-3 gap-1.5 opacity-20">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        ))}
      </div>
      <div className="pointer-events-none absolute top-[10%] left-[2%] grid grid-cols-3 gap-1.5 opacity-15">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        ))}
      </div>

      {/* Terminal lines decoration */}
      <div className="pointer-events-none absolute right-[12%] top-[26%] space-y-1 font-mono text-[10px] leading-tight text-blue-500 opacity-20">
        <div>&gt; AUTH_INIT...</div>
        <div>SESSION: 0xb2e9</div>
        <div>STATUS: SECURED</div>
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 opacity-20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <Shield className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cykruit
          </h1>
          <p className="mt-1 font-mono text-[10px] tracking-widest text-slate-400">
            ADMIN CONSOLE
          </p>
        </div>

        {/* Glass card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          {/* Top accent line */}
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          {/* Inner corner brackets */}
          <div className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-blue-100" />
          <div className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-blue-100" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-blue-100" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-blue-100" />

          <div className="p-8">
            {/* Status pill */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 font-mono text-[10px] tracking-widest text-blue-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              AUTH.ADMIN
            </div>

            <h2 className="mb-1 text-xl font-bold text-slate-900">
              Administrator sign in
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Enter your credentials to access the admin console.
            </p>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Terminal */}
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="font-mono text-[10px] tracking-wider text-slate-400">
            {typed}
            <span className="animate-pulse">▌</span>
          </span>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-wider text-slate-400">
          VERIFIED · SECURE · ADMIN ACCESS ONLY
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin text-blue-600"><Activity /></div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
