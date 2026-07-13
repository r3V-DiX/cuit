'use client';

// admin-ui/app/(admin)/users/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { User } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, User as UserIcon, ShieldAlert, Mail, Calendar, LogIn, Activity, Trash2, BadgeCheck, LockKeyholeOpen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { openModal } = useModal();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await api.get<User>(`/api/admin/users/${id}`);
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [id]);

  const handleToggleSuspend = () => {
    if (!user) return;
    const isSuspended = user.status === 'SUSPENDED';
    const action = isSuspended ? 'unsuspend' : 'suspend';

    openModal({
      title: `${isSuspended ? 'Unsuspend' : 'Suspend'} User`,
      description: `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
      variant: isSuspended ? 'default' : 'danger',
      confirmLabel: isSuspended ? 'Unsuspend' : 'Suspend',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await api.patch<User>(`/api/admin/users/${id}/${action}`);
          setUser(updated);
          toast({ type: 'success', message: `User ${action}ed successfully.` });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : `Failed to ${action} user` });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!user) return;
    openModal({
      title: 'Delete User',
      description: `"${user.firstName} ${user.lastName}" will be soft-deleted and lose access immediately. This cannot be undone from this page.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await api.del<User>(`/api/admin/users/${id}`);
          setUser(updated);
          toast({ type: 'success', message: 'User deleted.' });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete user' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleVerifyEmail = async () => {
    setActionLoading(true);
    try {
      const updated = await api.patch<User>(`/api/admin/users/${id}/verify-email`);
      setUser(updated);
      toast({ type: 'success', message: 'Email marked as verified.' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to verify email' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    setActionLoading(true);
    try {
      const updated = await api.patch<User>(`/api/admin/users/${id}/unlock`);
      setUser(updated);
      toast({ type: 'success', message: 'User unlocked.' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to unlock user' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <RequirePermission action={ACTIONS.USERS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/users"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              User Details
            </h2>
          </div>
        </div>

        {loading || !user ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="col-span-1 space-y-6 lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <UserIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="font-mono text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {user.status !== 'DELETED' && (
                        <RequirePermission action={ACTIONS.USERS.SUSPEND}>
                          <Button
                            variant={user.status === 'SUSPENDED' ? 'secondary' : 'danger'}
                            onClick={handleToggleSuspend}
                            loading={actionLoading}
                            icon={<ShieldAlert className="h-4 w-4" />}
                          >
                            {user.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                          </Button>
                        </RequirePermission>
                      )}
                      {!user.isEmailVerified && user.status !== 'DELETED' && (
                        <RequirePermission action={ACTIONS.USERS.SUSPEND}>
                          <Button
                            variant="secondary"
                            onClick={handleVerifyEmail}
                            loading={actionLoading}
                            icon={<BadgeCheck className="h-4 w-4" />}
                          >
                            Verify Email
                          </Button>
                        </RequirePermission>
                      )}
                      {(user.failedLoginAttempts > 0 || user.lockedUntil) && user.status !== 'DELETED' && (
                        <RequirePermission action={ACTIONS.USERS.UNLOCK}>
                          <Button
                            variant="secondary"
                            onClick={handleUnlock}
                            loading={actionLoading}
                            icon={<LockKeyholeOpen className="h-4 w-4" />}
                          >
                            Unlock
                          </Button>
                        </RequirePermission>
                      )}
                      {user.status !== 'DELETED' && (
                        <RequirePermission action={ACTIONS.USERS.DELETE}>
                          <Button
                            variant="danger"
                            onClick={handleDelete}
                            loading={actionLoading}
                            icon={<Trash2 className="h-4 w-4" />}
                          >
                            Delete
                          </Button>
                        </RequirePermission>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Role</p>
                    <div className="mt-1">
                      <StatusBadge status={user.role} />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={user.status} />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Joined</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Last Login</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employer details if role is EMPLOYER */}
              {user.role === 'EMPLOYER' && user.employer && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Employer Profile</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6 p-6">
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Company Name</p>
                      <p className="mt-1 text-sm text-slate-900">{user.employer.companyName || '—'}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Industry</p>
                      <p className="mt-1 text-sm text-slate-900">{user.employer.industry || '—'}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Location</p>
                      <p className="mt-1 text-sm text-slate-900">{user.employer.location || '—'}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Website</p>
                      <p className="mt-1 text-sm text-slate-900">
                        {user.employer.companyWebsite ? (
                          <a href={user.employer.companyWebsite} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            {user.employer.companyWebsite}
                          </a>
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Side Panel: Security & Logs */}
            <div className="col-span-1 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-900">Security</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Email Verified</p>
                      <p className="text-xs text-slate-500">{user.isEmailVerified ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <LogIn className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Failed Logins</p>
                      <p className="text-xs text-slate-500">{user.failedLoginAttempts} attempts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Last IP Address</p>
                      <p className="font-mono text-xs text-slate-500">{user.lastLoginIp || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
