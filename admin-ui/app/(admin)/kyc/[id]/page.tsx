'use client';

// admin-ui/app/(admin)/kyc/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { EmployerVerification } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, Building2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function KycDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [kyc, setKyc] = useState<EmployerVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadKyc() {
      try {
        const data = await api.get<EmployerVerification>(`/api/admin/kyc/${id}`);
        setKyc(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KYC details');
      } finally {
        setLoading(false);
      }
    }
    loadKyc();
  }, [id]);

  const handleApprove = () => {
    if (!kyc) return;
    openModal({
      title: 'Approve KYC Request',
      description: `Are you sure you want to approve the verification request for ${kyc.companyName}? This will verify the employer.`,
      variant: 'success',
      confirmLabel: 'Approve',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await api.patch<EmployerVerification>(`/api/admin/kyc/${id}/approve`);
          setKyc(updated);
          toast({ type: 'success', message: 'KYC request approved.' });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to approve KYC' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = () => {
    if (!kyc) return;
    let reason = '';
    
    // We can use the Modal content prop to render an input for the rejection reason.
    openModal({
      title: 'Reject KYC Request',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Please provide a reason for rejecting the verification request for {kyc.companyName}. This will be sent to the employer.
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
          throw new Error('Reason required'); // Prevents modal from closing automatically if handled properly, but our Modal closes on finally. 
                                              // We'll let it close and show the error for now to keep it simple.
        }
        setActionLoading(true);
        try {
          const updated = await api.patch<EmployerVerification>(`/api/admin/kyc/${id}/reject`, { reason });
          setKyc(updated);
          toast({ type: 'success', message: 'KYC request rejected.' });
        } catch (err) {
          toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reject KYC' });
          throw err; // Rethrow to prevent closing if possible, though Modal always closes in finally.
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
    <RequirePermission action={ACTIONS.KYC.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/kyc"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                KYC Details
              </h2>
            </div>
          </div>
          {kyc && kyc.status === 'PENDING' && (
            <RequirePermission action={ACTIONS.KYC.REVIEW}>
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

        {loading || !kyc ? (
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
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {kyc.companyName}
                      </h3>
                      <div className="mt-2 flex items-center gap-3">
                        <StatusBadge status={kyc.status} />
                        <span className="text-sm text-slate-500">
                          Submitted on {format(new Date(kyc.submittedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Industry</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{kyc.industry || '—'}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Company Size</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{kyc.companySize || '—'}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-400">Company Type</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{kyc.companyType || '—'}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <p className="font-mono text-[10px] uppercase text-slate-400">Location</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{kyc.location || '—'}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <p className="font-mono text-[10px] uppercase text-slate-400">Website</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {kyc.companyWebsite ? (
                        <a href={kyc.companyWebsite} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          {kyc.companyWebsite} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status History */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">Status History</h3>
                </div>
                <div className="p-6">
                  {kyc.statusHistory && kyc.statusHistory.length > 0 ? (
                    <div className="space-y-6">
                      {kyc.statusHistory.map((entry, idx) => (
                        <div key={idx} className="relative pl-6">
                          {idx !== kyc.statusHistory.length - 1 && (
                            <div className="absolute top-6 left-2.5 h-full w-px bg-slate-200" />
                          )}
                          <div className="absolute top-1.5 left-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={entry.status} />
                              <span className="text-xs text-slate-500">
                                {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                              </span>
                            </div>
                            {entry.reason && (
                              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                {entry.reason}
                              </p>
                            )}
                            {entry.by && (
                              <p className="mt-1 text-xs text-slate-400">By Admin ID: {entry.by}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No status history available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel: Documents */}
            <div className="col-span-1 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="font-semibold text-slate-900">Verification Document</h3>
                </div>
                <div className="p-5">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 border-dashed bg-slate-50 p-6 text-center">
                    <ExternalLink className="mb-2 h-8 w-8 text-slate-400" />
                    <p className="mb-4 text-sm text-slate-600">
                      {kyc.documentFileName || 'Document provided'}
                    </p>
                    <a
                      href={kyc.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      View Document
                    </a>
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
