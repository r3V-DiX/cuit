'use client';

// admin-ui/app/accept-invite/page.tsx
// Public page — outside the (admin) route group, no PermissionsProvider/sidebar.
// Reads ?token= from the invite email link, sets a password, and the backend
// creates the Admin row + session in one step (see admin-invite-accept.controller.ts).
//
// Flow:
//  1. POST /api/admin/admins/invite/accept
//  2. GET /api/admin/me — resolved RBAC context (stored in sessionStorage for (admin)/layout)
//  3. router.replace('/dashboard')

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle, Activity } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

function AcceptInvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This invite link is missing its token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Step 1 — Accept invite (creates the Admin row + session)
      await api.post('/api/admin/admins/invite/accept', {
        token,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      // Step 2 — Load RBAC permissions into sessionStorage for (admin)/layout
      try {
        const adminMeRes = await fetch('/api/admin/me');
        if (adminMeRes.ok) {
          const adminMeBody = (await adminMeRes.json()) as {
            success: boolean;
            data?: unknown;
          };
          if (adminMeBody.success && adminMeBody.data) {
            sessionStorage.setItem('admin_permissions', JSON.stringify(adminMeBody.data));
          }
        }
      } catch {
        // Non-fatal — (admin)/layout will refetch
      }

      // Step 3 — Navigate
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept invite.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 opacity-20 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <Shield className="h-8 w-8 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cykruit</h1>
          <p className="mt-1 font-mono text-[10px] tracking-widest text-slate-400">
            ADMIN CONSOLE
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="p-8">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 font-mono text-[10px] tracking-widest text-blue-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              AUTH.INVITE
            </div>

            <h2 className="mb-1 text-xl font-bold text-slate-900">Set up your account</h2>
            <p className="mb-6 text-sm text-slate-500">
              You&apos;ve been invited to the Cykruit admin console. Set your name and
              password to activate your account.
            </p>

            {!token && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>This invite link is missing its token. Ask a super admin to resend it.</span>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <>
                    Activate account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-wider text-slate-400">
          VERIFIED · SECURE · ADMIN ACCESS ONLY
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="animate-spin text-blue-600">
            <Activity />
          </div>
        </div>
      }
    >
      <AcceptInvitePageContent />
    </Suspense>
  );
}
