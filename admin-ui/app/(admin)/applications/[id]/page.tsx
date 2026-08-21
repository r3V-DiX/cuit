'use client';

// admin-ui/app/(admin)/applications/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { ApplicationDetail } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { ArrowLeft, Briefcase, Calendar, FileText, Sparkles, Eye } from 'lucide-react';

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplication() {
      try {
        const data = await api.get<ApplicationDetail>(`/api/admin/applications/${id}`);
        setApplication(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load application');
      } finally {
        setLoading(false);
      }
    }
    loadApplication();
  }, [id]);

  const handleViewResume = () => {
    if (!application?.resume) return;
    // Opens the admin-app's own streaming route directly — the browser
    // never sees a presigned S3 URL, only this auth-gated admin-app endpoint.
    window.open(`/api/admin/resumes/${application.resume.id}/view`, '_blank', 'noopener,noreferrer');
  };

  if (!loading && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const screeningAnswers =
    application?.screeningAnswers && typeof application.screeningAnswers === 'object'
      ? (application.screeningAnswers as Record<string, unknown>)
      : null;

  return (
    <RequirePermission action={ACTIONS.APPLICATIONS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/applications"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">Application Details</h2>
        </div>

        {loading || !application ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="col-span-1 space-y-6 lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {application.jobSeeker
                          ? `${application.jobSeeker.firstName} ${application.jobSeeker.lastName}`
                          : '—'}
                      </h3>
                      <p className="font-mono text-sm text-slate-500">{application.jobSeeker?.email}</p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Job</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {application.job?.jobTitle ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Company</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {application.job?.employer?.companyName ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">AI Score</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {application.aiScore ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              {screeningAnswers && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Screening Answers</h3>
                  </div>
                  <div className="space-y-3 p-6">
                    {Object.entries(screeningAnswers).map(([question, answer]) => (
                      <div key={question}>
                        <p className="text-xs font-medium text-slate-500">{question}</p>
                        <p className="mt-0.5 text-sm text-slate-900">{String(answer)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {application.statusHistory.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Status History</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {application.statusHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.oldStatus} />
                          <span className="text-slate-400">→</span>
                          <StatusBadge status={entry.newStatus} />
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(entry.changedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {application.notes.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                    <h3 className="font-semibold text-slate-900">Employer Notes</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {application.notes.map((note) => (
                      <div key={note.id} className="p-4">
                        <p className="text-sm text-slate-800">{note.note}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-1 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-900">Details</h3>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Applied</p>
                      <p className="text-xs text-slate-500">
                        {new Date(application.appliedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {application.job?.id && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <Link
                          href={`/jobs/${application.job.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          View job posting
                        </Link>
                      </div>
                    </div>
                  )}
                  {application.aiScoredAt && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">AI Scored</p>
                        <p className="text-xs text-slate-500">
                          {new Date(application.aiScoredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {application.resume && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {application.resume.fileName}
                        </p>
                        <button
                          onClick={handleViewResume}
                          className="mt-0.5 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          View resume
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
