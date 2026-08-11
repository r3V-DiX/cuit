'use client';

// admin-ui/app/login/page.tsx

// Admin-only login page. Adapted from cykruit-ui's light-theme OTP login.
// NO password, NO registration, NO OAuth, NO role toggle.
//
// Flow:
//  1. POST /api/admin/auth/request-otp — email a 6-digit code
//  2. POST /api/admin/auth/verify-otp — verify + set session/csrf cookies
//  3. GET /api/admin/me — resolved RBAC context (stored in sessionStorage for (admin)/layout)
//  4. router.replace(redirect ?? '/dashboard')

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, ArrowRight, AlertCircle, Activity, RefreshCw, Mail } from 'lucide-react';
import { api, ApiError } from '@/lib';

// ── OTP digit input (mirrors cykruit-ui's app/login/page.tsx OtpInput) ──────

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const valueRef = useRef(value);
  valueRef.current = value;

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits.length > 1) {
      const filled = (valueRef.current.slice(0, i) + digits).slice(0, 6);
      valueRef.current = filled;
      onChange(filled);
      refs.current[Math.min(filled.length, 5)]?.focus();
      return;
    }
    if (!digits) return;
    const next = (valueRef.current.slice(0, i) + digits + valueRef.current.slice(i + 1)).slice(0, 6);
    valueRef.current = next;
    onChange(next);
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    const cur = valueRef.current;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cur[i]) {
        const next = cur.slice(0, i) + cur.slice(i + 1);
        valueRef.current = next;
        onChange(next);
      } else if (i > 0) {
        const next = cur.slice(0, i - 1) + cur.slice(i);
        valueRef.current = next;
        onChange(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'Enter' && cur.length === 6) {
      (e.target as HTMLInputElement).form?.requestSubmit();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      e.preventDefault();
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function handleFocus(i: number) {
    const nextEmpty = valueRef.current.length;
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
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(i)}
          disabled={disabled}
          autoFocus={i === 0}
          className={`h-13 w-11 rounded-xl border-2 text-center font-mono text-xl font-bold transition-all focus:outline-none ${
            value.length === i
              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm shadow-blue-200'
              : value[i]
              ? 'border-slate-300 bg-white text-slate-900'
              : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        />
      ))}
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email') ?? '';
  const activated = searchParams.get('activated') === '1';

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState(prefillEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(activated ? '' : '');
  const [info, setInfo] = useState(activated ? 'Account activated. Sign in with the code we email you.' : '');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Terminal typing effect
  const phrases = [
    'INITIALIZING ADMIN SESSION...',
    'VERIFYING OTP...',
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

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await api.post('/api/admin/auth/request-otp', { email: email.trim().toLowerCase() });
      setStep('otp');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(
        '/api/admin/auth/verify-otp',
        { email: email.trim().toLowerCase(), otp, rememberMe: true },
        { skipAuthRedirect: true },
      );

      try {
        const adminMeRes = await fetch('/api/admin/me');
        if (adminMeRes.ok) {
          const adminMeBody = (await adminMeRes.json()) as { success: boolean; data?: unknown };
          if (adminMeBody.success && adminMeBody.data) {
            sessionStorage.setItem('admin_permissions', JSON.stringify(adminMeBody.data));
          }
        }
      } catch {
        // Non-fatal — (admin)/layout will refetch
      }

      router.replace(redirect ?? '/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Invalid OTP.';
      setError(message);
      if (message.includes('locked')) {
        setStep('email');
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/api/admin/auth/request-otp', { email: email.trim().toLowerCase() });
      setOtp('');
      startResendCooldown();
      setInfo('New OTP sent.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resend OTP.');
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
              AUTH.OTP
            </div>

            {step === 'email' ? (
              <>
                <h2 className="mb-1 text-xl font-bold text-slate-900">
                  Administrator sign in
                </h2>
                <p className="mb-6 text-sm text-slate-500">
                  Enter your email and we&apos;ll send you a sign-in code.
                </p>

                {info && (
                  <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {info}
                  </div>
                )}
                {error && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                      Email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                  </div>

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
                        <Mail className="h-4 w-4" />
                        Send OTP
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="mb-1 text-xl font-bold text-slate-900">Check your inbox</h2>
                <p className="mb-6 text-sm text-slate-500">
                  We sent a 6-digit code to{' '}
                  <span className="font-mono font-medium text-slate-700">{email}</span>
                </p>

                {info && (
                  <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {info}
                  </div>
                )}
                {error && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="mb-3 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                      Enter OTP
                    </label>
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <>
                        Verify & sign in
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtp(''); setError(''); setInfo(''); }}
                    className="text-sm text-slate-500 transition-colors hover:text-blue-600"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}
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
