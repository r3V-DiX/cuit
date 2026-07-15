'use client';

// admin-ui/app/(admin)/jobs/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { Job } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Button } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { ArrowLeft, Briefcase, ExternalLink, CheckCircle, XCircle, MapPin, Clock, Building } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { openModal } = useModal();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await api.get<Job>(`/api/admin/jobs/${id}`);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  const handleApprove = () => {
    if (!job) return;
    openModal({
      title: 'Approve Job Posting',
      description: `Are you sure you want to approve "${job.jobTitle}"? This will make the job visible to seekers.`,
      variant: 'success',
      confirmLabel: 'Approve',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await api.patch<Job>(`/api/admin/jobs/${id}/approve`);
          setJob(updated);
          toast({ type: 'success', message: 'Job posting approved.' });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve job' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = () => {
    if (!job) return;
    let reason = '';
    
    openModal({
      title: 'Reject Job Posting',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Please provide a reason for rejecting this job posting. This will be sent to the employer.
          </p>
          <textarea
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            rows={4}
            placeholder="Rejection reason..."
            onChange={(e) => { reason = e.target.value; }}
          />
        </div>
      ),
      variant: 'danger',
      confirmLabel: 'Reject',
      onConfirm: async () => {
        if (!reason.trim()) {
          toast({ type: 'error', message: 'Rejection reason is required.' });
          throw new Error('Reason required');
        }
        setActionLoading(true);
        try {
          const updated = await api.patch<Job>(`/api/admin/jobs/${id}/reject`, { reason });
          setJob(updated);
          toast({ type: 'success', message: 'Job posting rejected.' });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject job' });
          throw err;
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <RequirePermission action={ACTIONS.JOBS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Job Details
              </h2>
            </div>
          </div>
          {job && job.status === 'PENDING' && (
            <RequirePermission action={ACTIONS.JOBS.REVIEW}>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleReject}
                  disabled={actionLoading}
                  icon={<XCircle className="h-4 w-4" />}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Approve
                </Button>
              </div>
            </RequirePermission>
          )}
        </div>

        {loading || !job ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-1 space-y-6 lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="col-span-1 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
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
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Briefcase className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {job.jobTitle}
                        </h3>
                        <div className="mt-2 flex items-center gap-3">
                          <StatusBadge status={job.status} />
                          <span className="text-sm text-slate-500">
                            Created {format(new Date(job.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50 p-6 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Employer</p>
                      <p className="text-sm font-medium text-slate-900">{job.employer?.companyName || job.employerId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Location</p>
                      <p className="text-sm font-medium text-slate-900">{job.location?.displayName ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Job Type</p>
                      <p className="text-sm font-medium text-slate-900">{job.jobType || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">Experience</p>
                      <p className="text-sm font-medium text-slate-900">{job.experienceLevel || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-semibold text-slate-900">Description</h4>
                  <div 
                    className="mt-4 prose prose-sm max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: job.description || 'No description provided.' }}
                  />
                </div>
              </div>

              {job.status === 'REJECTED' && job.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                  <h4 className="font-semibold text-red-900">Rejection Reason</h4>
                  <p className="mt-2 text-sm text-red-700">{job.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Side Panel */}
            <div className="col-span-1 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-900">Application Details</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Application Type</p>
                    <p className="mt-1 text-sm text-slate-900">{job.applicationType || 'CYKRUIT'}</p>
                  </div>
                  {job.externalUrl && (
                    <div>
                      <p className="font-mono text-[10px] uppercase text-slate-400">External URL</p>
                      <a href={job.externalUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        {job.externalUrl} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Screening Questions</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {job.screeningQuestions ? Object.keys(job.screeningQuestions).length : 0} questions
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-900">Metrics</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Views</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{job.viewCount || 0}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Applicants</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{job.applicationCount || 0}</p>
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
