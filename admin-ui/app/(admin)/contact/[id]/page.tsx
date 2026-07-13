'use client';

// admin-ui/app/(admin)/contact/[id]/page.tsx
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { ContactForm, ContactFormStatus } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import Skeleton from '@/components/ui/Skeleton';
import { ArrowLeft, Mail, Calendar, CheckCircle2, ShieldOff, Eye } from 'lucide-react';

const STATUS_ACTIONS: { status: ContactFormStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'REVIEWED', label: 'Mark Reviewed', icon: <Eye className="h-4 w-4" /> },
  { status: 'RESOLVED', label: 'Mark Resolved', icon: <CheckCircle2 className="h-4 w-4" /> },
  { status: 'SPAM', label: 'Mark Spam', icon: <ShieldOff className="h-4 w-4" /> },
];

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const [contact, setContact] = useState<ContactForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<ContactFormStatus | null>(null);

  useEffect(() => {
    async function loadContact() {
      try {
        const data = await api.get<ContactForm>(`/api/admin/contact/${id}`);
        setContact(data);
        setNotes(data.notes ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact form submission');
      } finally {
        setLoading(false);
      }
    }
    loadContact();
  }, [id]);

  const handleStatusChange = async (status: ContactFormStatus) => {
    setActionLoading(status);
    try {
      const updated = await api.patch<ContactForm>(`/api/admin/contact/${id}/status`, {
        status,
        notes: notes.trim() || undefined,
      });
      setContact(updated);
      toast({ type: 'success', message: `Marked as ${status.toLowerCase()}.` });
    } catch (err) {
      toast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update status',
      });
    } finally {
      setActionLoading(null);
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
    <RequirePermission action={ACTIONS.CONTACT.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-slate-900">Contact Form Submission</h2>
        </div>

        {loading || !contact ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="col-span-1 space-y-6 lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{contact.fullName}</h3>
                      <p className="font-mono text-sm text-slate-500">{contact.email}</p>
                    </div>
                    <StatusBadge status={contact.status} />
                  </div>
                </div>
                <div className="p-6">
                  <p className="font-mono text-[10px] uppercase text-slate-400">Message</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{contact.message}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">Review</h3>
                </div>
                <div className="space-y-4 p-6">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Internal notes about this submission..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <RequirePermission action={ACTIONS.CONTACT.MANAGE}>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_ACTIONS.map((a) => (
                        <Button
                          key={a.status}
                          variant={contact.status === a.status ? 'secondary' : 'primary'}
                          size="sm"
                          disabled={contact.status === a.status}
                          loading={actionLoading === a.status}
                          onClick={() => handleStatusChange(a.status)}
                          icon={a.icon}
                        >
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  </RequirePermission>
                </div>
              </div>
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
                      <p className="text-sm font-medium text-slate-900">Submitted</p>
                      <p className="text-xs text-slate-500">
                        {new Date(contact.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {contact.reviewedAt && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Last Reviewed</p>
                        <p className="text-xs text-slate-500">
                          {new Date(contact.reviewedAt).toLocaleString()}
                        </p>
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
