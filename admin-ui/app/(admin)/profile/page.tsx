'use client';

// admin-ui/app/(admin)/profile/page.tsx
// The current admin's own profile: edit name/phone, view assigned role and
// resolved permissions, and manage active sessions (list + revoke). No
// permission gate beyond being authenticated — every admin owns this page.

import { useEffect, useState } from 'react';
import { api } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { AdminSessionInfo } from '@/lib';
import { Skeleton } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Pencil, Shield, Clock, Monitor, Smartphone, LogOut } from 'lucide-react';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400';
const labelCls = 'mb-1 block text-xs font-medium text-slate-600';
const eyebrowCls = 'font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400';

function groupPermissionsByModule(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const perm of permissions) {
    const [module] = perm.split(':');
    (groups[module] ??= []).push(perm);
  }
  return groups;
}

function formatRelative(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatCountdown(iso: string, now: number): { label: string; urgent: boolean } {
  const diffMs = new Date(iso).getTime() - now;
  if (diffMs <= 0) return { label: 'Expired', urgent: true };
  const min = Math.floor(diffMs / 60000);
  if (min < 60) return { label: `${min}m left`, urgent: min < 10 };
  const hr = Math.floor(min / 60);
  if (hr < 24) return { label: `${hr}h ${min % 60}m left`, urgent: false };
  const days = Math.floor(hr / 24);
  return { label: `${days}d left`, urgent: false };
}

export default function ProfilePage() {
  const { user, roles, permissions, sessionExpiresAt, loaded, refresh } = usePermissions();
  const { toast } = useToast();
  const { openModal, closeModal } = useModal();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [sessions, setSessions] = useState<AdminSessionInfo[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [now, setNow] = useState(() => Date.now());

  // Force a fresh /admin/me fetch on mount — this page shows "current" state
  // (last login, session expiry), which the shared context may have loaded
  // a while before this page was ever visited.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? '');
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadSessions() {
      setSessionsError(null);
      try {
        const res = await api.get<AdminSessionInfo[]>('/api/admin/me/sessions');
        if (!cancelled) setSessions(res);
      } catch (err) {
        if (!cancelled) {
          setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
        }
      }
    }
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Live tick for countdowns/relative times — every 30s is plenty.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/api/admin/me', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      await refresh();
      toast({ type: 'success', message: 'Profile updated.' });
      setEditing(false);
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleRevoke(session: AdminSessionInfo) {
    openModal({
      title: session.isCurrent ? 'Sign out this device?' : 'Revoke session?',
      description: session.isCurrent
        ? "This is your current session — you'll be signed out immediately."
        : `"${session.deviceLabel}" will be signed out immediately.`,
      variant: 'danger',
      confirmLabel: session.isCurrent ? 'Sign out' : 'Revoke',
      onConfirm: async () => {
        try {
          await api.del<{ wasCurrent: boolean }>(`/api/admin/me/sessions/${session.id}`);
          if (session.isCurrent) {
            window.location.href = '/login';
            return;
          }
          toast({ type: 'success', message: 'Session revoked.' });
          setReloadKey((k) => k + 1);
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to revoke session',
          });
        } finally {
          closeModal();
        }
      },
    });
  }

  if (!loaded || !user) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  const permGroups = groupPermissionsByModule(permissions);
  const modules = Object.keys(permGroups).sort();
  const countdown = sessionExpiresAt ? formatCountdown(sessionExpiresAt, now) : null;

  return (
    <div className="space-y-6">
      {/* Identity badge header — the one signature element: a live "session
          active" indicator, echoing this console's login/invite-accept pages'
          pulsing-dot badge motif, but functional here rather than decorative. */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
              {initials || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-700"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 sm:flex-col sm:items-end sm:gap-1 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                Session Active
              </span>
            </div>
            {countdown && (
              <span className={`text-xs ${countdown.urgent ? 'font-medium text-amber-600' : 'text-slate-500'}`}>
                Expires in {countdown.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity — editable */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-4">
            <p className={eyebrowCls}>Identity</p>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
          <div className="p-6 pt-4">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>First name</label>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Last name</label>
                    <input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input value={user.email} disabled className={inputCls} />
                  <p className="mt-1 text-xs text-slate-400">
                    Email can&apos;t be changed here — it&apos;s your sign-in identity.
                  </p>
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-slate-400">First name</dt>
                  <dd className="text-sm font-medium text-slate-900">{user.firstName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Last name</dt>
                  <dd className="text-sm font-medium text-slate-900">{user.lastName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Email</dt>
                  <dd className="text-sm font-medium text-slate-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Phone</dt>
                  <dd className="text-sm font-medium text-slate-900">{user.phone || '—'}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {/* Access + recent activity */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 pb-4">
              <p className={`${eyebrowCls} flex items-center gap-1.5`}>
                <Shield className="h-3.5 w-3.5" />
                Access
              </p>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto p-6 pt-4">
              {modules.length === 0 ? (
                <p className="text-sm text-slate-400">No permissions assigned.</p>
              ) : (
                modules.map((mod) => (
                  <div key={mod}>
                    <p className="mb-1 font-mono text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {mod}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {permGroups[mod].map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center rounded-lg bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 pb-4">
              <p className={`${eyebrowCls} flex items-center gap-1.5`}>
                <Clock className="h-3.5 w-3.5" />
                Last Login
              </p>
            </div>
            <div className="p-6 pt-4">
              <p className="text-sm text-slate-700">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </p>
              {user.lastLoginIp && <p className="mt-0.5 text-xs text-slate-400">from {user.lastLoginIp}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Active sessions */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6 pb-4">
          <p className={eyebrowCls}>Active Sessions</p>
          <p className="mt-1 text-sm text-slate-500">
            Every device currently signed in as you. Revoke any you don&apos;t recognize.
          </p>
        </div>
        <div className="p-6 pt-4">
          {sessionsError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {sessionsError}
            </div>
          ) : !sessions ? (
            <SkeletonTable rows={3} />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No active sessions.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessions.map((s) => {
                const isMobile = /android|ios/i.test(s.osName);
                const exp = formatCountdown(s.expiresAt, now);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          s.isCurrent ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                          {s.deviceLabel}
                          {s.isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 uppercase">
                              <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                              This device
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {s.ipAddress ?? 'Unknown IP'} · Active {formatRelative(s.lastActivity, now)} ·{' '}
                          {exp.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(s)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title={s.isCurrent ? 'Sign out this device' : 'Revoke session'}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {s.isCurrent ? 'Sign out' : 'Revoke'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
