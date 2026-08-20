'use client';

// admin-ui/app/(admin)/users/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { User } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Button } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { Table } from '@/components/ui';
import {
  ArrowLeft,
  User as UserIcon,
  ShieldAlert,
  Mail,
  Calendar,
  LogIn,
  Activity,
  Trash2,
  BadgeCheck,
  LockKeyholeOpen,
  Flag,
  FlagOff,
  FileText,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import FlagUserForm from '../_components/flag-user-form';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingResumeId, setViewingResumeId] = useState<string | null>(null);

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

  const handleFlag = () => {
    openModal({
      title: 'Flag user',
      content: (
        <FlagUserForm
          userId={id}
          onSaved={(updated) => {
            setUser(updated);
            closeModal();
            toast({ type: 'success', message: 'User flagged.' });
          }}
          onCancel={closeModal}
        />
      ),
    });
  };

  const handleUnflag = () => {
    if (!user) return;
    openModal({
      title: 'Unflag user?',
      description: `"${user.firstName} ${user.lastName}" will no longer be marked as flagged.`,
      variant: 'default',
      confirmLabel: 'Unflag',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await api.patch<User>(`/api/admin/users/${id}/unflag`);
          setUser(updated);
          toast({ type: 'success', message: 'User unflagged.' });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to unflag user' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleViewResume = async (resumeId: string) => {
    setViewingResumeId(resumeId);
    try {
      const { url } = await api.get<{ url: string }>(`/api/admin/resumes/${resumeId}/view`);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to open resume' });
    } finally {
      setViewingResumeId(null);
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
          <>
            {user.isFlagged && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <Flag className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Flagged account</p>
                  <p className="text-sm text-red-700">{user.flaggedReason}</p>
                  {user.flaggedAt && (
                    <p className="mt-1 text-xs text-red-500">
                      Flagged on {format(new Date(user.flaggedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            )}
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
                        <RequirePermission action={ACTIONS.USERS.SUSPEND}>
                          <Button
                            variant={user.isFlagged ? 'secondary' : 'danger'}
                            onClick={user.isFlagged ? handleUnflag : handleFlag}
                            loading={actionLoading}
                            icon={user.isFlagged ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                          >
                            {user.isFlagged ? 'Unflag' : 'Flag'}
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
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Employer Profile</h3>
                    <div className="flex items-center gap-2">
                      {user.employer.isVerified && <StatusBadge status="APPROVED" />}
                      {user.employer.isFlagged && <StatusBadge status="REJECTED" />}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-3">
                    <Field label="Company Name" value={user.employer.companyName} />
                    <Field label="Company Type" value={user.employer.companyType} />
                    <Field label="Industry" value={user.employer.industry} />
                    <Field label="Company Size" value={user.employer.companySize} />
                    <Field label="Location" value={user.employer.location} />
                    <Field label="Founded" value={user.employer.foundedYear?.toString()} />
                    <Field label="Contact Email" value={user.employer.contactEmail} />
                    <Field label="Profile Completion" value={user.employer.profileCompletion !== undefined ? `${user.employer.profileCompletion}%` : undefined} />
                    <Field
                      label="Website"
                      value={user.employer.companyWebsite}
                      href={user.employer.companyWebsite}
                    />
                    <Field label="LinkedIn" value={user.employer.linkedin} href={user.employer.linkedin} />
                    <Field label="Twitter" value={user.employer.twitter} href={user.employer.twitter} />
                    <Field label="Facebook" value={user.employer.facebook} href={user.employer.facebook} />
                    <Field label="Instagram" value={user.employer.instagram} href={user.employer.instagram} />
                  </div>
                  {(user.employer.tagline || user.employer.about || user.employer.mission || user.employer.vision) && (
                    <div className="space-y-4 border-t border-slate-100 p-6">
                      {user.employer.tagline && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-slate-400">Tagline</p>
                          <p className="mt-1 text-sm text-slate-900">{user.employer.tagline}</p>
                        </div>
                      )}
                      {user.employer.about && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-slate-400">About</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{user.employer.about}</p>
                        </div>
                      )}
                      {user.employer.mission && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-slate-400">Mission</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{user.employer.mission}</p>
                        </div>
                      )}
                      {user.employer.vision && (
                        <div>
                          <p className="font-mono text-[10px] uppercase text-slate-400">Vision</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{user.employer.vision}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Jobseeker profile details if role is SEEKER */}
              {user.role === 'SEEKER' && user.jobSeekerProfile && (
                <>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                      <h3 className="font-semibold text-slate-900">Jobseeker Profile</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-3">
                      <Field label="Title" value={user.jobSeekerProfile.title} />
                      <Field label="Availability" value={user.jobSeekerProfile.availability} />
                      <Field label="Location" value={user.jobSeekerProfile.location?.displayName} />
                      <Field label="Professional Email" value={user.jobSeekerProfile.professionalEmail} />
                      <Field label="Profile Completion" value={`${user.jobSeekerProfile.profileCompletion}%`} />
                      <Field label="LinkedIn" value={user.jobSeekerProfile.linkedin} href={user.jobSeekerProfile.linkedin} />
                      <Field label="GitHub" value={user.jobSeekerProfile.github} href={user.jobSeekerProfile.github} />
                      <Field label="Portfolio" value={user.jobSeekerProfile.portfolio} href={user.jobSeekerProfile.portfolio} />
                      <Field label="Twitter" value={user.jobSeekerProfile.twitter} href={user.jobSeekerProfile.twitter} />
                    </div>
                    {user.jobSeekerProfile.professionalSummary && (
                      <div className="border-t border-slate-100 p-6">
                        <p className="font-mono text-[10px] uppercase text-slate-400">Summary</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {user.jobSeekerProfile.professionalSummary}
                        </p>
                      </div>
                    )}
                  </div>

                  {user.jobSeekerProfile.experiences.length > 0 && (
                    <SubCard title="Experience">
                      <div className="divide-y divide-slate-100">
                        {user.jobSeekerProfile.experiences.map((exp) => (
                          <div key={exp.id} className="p-4">
                            <p className="text-sm font-medium text-slate-900">
                              {exp.title} · {exp.company}
                            </p>
                            <p className="text-xs text-slate-500">
                              {exp.location} · {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SubCard>
                  )}

                  {user.jobSeekerProfile.education.length > 0 && (
                    <SubCard title="Education">
                      <div className="divide-y divide-slate-100">
                        {user.jobSeekerProfile.education.map((edu) => (
                          <div key={edu.id} className="p-4">
                            <p className="text-sm font-medium text-slate-900">
                              {edu.degree}
                              {edu.fieldOfStudy ? ` · ${edu.fieldOfStudy}` : ''}
                            </p>
                            <p className="text-xs text-slate-500">
                              {edu.institute?.name || edu.instituteName || '—'} · {edu.startDate} – {edu.endDate}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SubCard>
                  )}

                  {user.jobSeekerProfile.skills.length > 0 && (
                    <SubCard title="Skills">
                      <div className="flex flex-wrap gap-2 p-4">
                        {user.jobSeekerProfile.skills.map((s) => (
                          <span
                            key={s.id}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                          >
                            {s.skill.name} · {s.proficiency}
                          </span>
                        ))}
                      </div>
                    </SubCard>
                  )}

                  {user.jobSeekerProfile.certifications.length > 0 && (
                    <SubCard title="Certifications">
                      <div className="divide-y divide-slate-100">
                        {user.jobSeekerProfile.certifications.map((c) => (
                          <div key={c.id} className="p-4">
                            <p className="text-sm font-medium text-slate-900">{c.certification.name}</p>
                            <p className="text-xs text-slate-500">
                              Issued {c.issueDate}
                              {c.expiryDate ? ` · Expires ${c.expiryDate}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SubCard>
                  )}

                  {user.jobSeekerProfile.projects.length > 0 && (
                    <SubCard title="Projects">
                      <div className="divide-y divide-slate-100">
                        {user.jobSeekerProfile.projects.map((p) => (
                          <div key={p.id} className="p-4">
                            <p className="text-sm font-medium text-slate-900">{p.title}</p>
                            <p className="text-xs text-slate-500">{p.technologies.join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    </SubCard>
                  )}

                  {user.jobSeekerProfile.ctfProfiles.length > 0 && (
                    <SubCard title="CTF / Bug Bounty Profiles">
                      <div className="divide-y divide-slate-100">
                        {user.jobSeekerProfile.ctfProfiles.map((c) => (
                          <div key={c.id} className="p-4">
                            <p className="text-sm font-medium text-slate-900">
                              {c.platform} · {c.username}
                            </p>
                            <p className="text-xs text-slate-500">
                              {c.rank || '—'}
                              {c.points !== undefined ? ` · ${c.points} pts` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SubCard>
                  )}

                  {user.jobSeekerProfile.resumes.length > 0 && (
                    <SubCard title="Resumes">
                      <div className="divide-y divide-slate-100">
                        {user.jobSeekerProfile.resumes.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{r.fileName}</p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(r.uploadedAt), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <RequirePermission action={ACTIONS.RESUMES.VIEW}>
                              <button
                                onClick={() => handleViewResume(r.id)}
                                disabled={viewingResumeId === r.id}
                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {viewingResumeId === r.id ? 'Opening…' : 'View'}
                              </button>
                            </RequirePermission>
                          </div>
                        ))}
                      </div>
                    </SubCard>
                  )}
                </>
              )}

              {/* Applications submitted by this user */}
              {user.applications && user.applications.length > 0 && (
                <RequirePermission action={ACTIONS.APPLICATIONS.VIEW}>
                  <SubCard title="Applications">
                    <Table
                      data={user.applications}
                      getRowKey={(a) => a.id}
                      onRowClick={(a) => router.push(`/applications/${a.id}`)}
                      columns={[
                        {
                          key: 'job',
                          header: 'Job',
                          render: (a) => (
                            <div>
                              <p className="text-slate-900">{a.job?.jobTitle ?? '—'}</p>
                              <p className="text-xs text-slate-500">{a.job?.employer?.companyName}</p>
                            </div>
                          ),
                        },
                        {
                          key: 'status',
                          header: 'Status',
                          render: (a) => <StatusBadge status={a.status} />,
                        },
                        {
                          key: 'aiScore',
                          header: 'AI Score',
                          render: (a) => <span className="text-slate-600">{a.aiScore ?? '—'}</span>,
                        },
                        {
                          key: 'appliedAt',
                          header: 'Applied',
                          render: (a) => (
                            <span className="text-sm text-slate-600">
                              {format(new Date(a.appliedAt), 'MMM d, yyyy')}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </SubCard>
                </RequirePermission>
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
          </>
        )}
      </div>
    </RequirePermission>
  );
}

function Field({ label, value, href }: { label: string; value?: string; href?: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm text-slate-900">
        {value ? (
          href ? (
            <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          '—'
        )}
      </p>
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
