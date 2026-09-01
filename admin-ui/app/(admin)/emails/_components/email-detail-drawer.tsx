'use client';

// admin-ui/app/(admin)/emails/_components/email-detail-drawer.tsx
import { useState, useEffect } from 'react';
import { api } from '@/lib';
import type { ResendEmailDetail } from '@/lib';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  FileCode,
  FileText,
  Eye,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface EmailDetailDrawerProps {
  emailId: string | null;
  onClose: () => void;
}

export function EmailDetailDrawer({ emailId, onClose }: EmailDetailDrawerProps) {
  const [email, setEmail] = useState<ResendEmailDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'text' | 'headers'>('preview');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  useEffect(() => {
    if (!emailId) return;

    let isMounted = true;
    async function loadDetails() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<ResendEmailDetail>(`/api/admin/emails/resend/logs/${emailId}`);
        if (isMounted) {
          setEmail(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch email details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [emailId]);

  if (!emailId) return null;

  const handleCopyId = () => {
    if (!emailId) return;
    navigator.clipboard.writeText(emailId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'sent').toLowerCase();
    if (s === 'delivered') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === 'suppressed') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          <ShieldAlert className="h-3.5 w-3.5 text-slate-600" />
          <span>Suppressed</span>
        </span>
      );
    }
    if (s === 'complained') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          <span>Complained</span>
        </span>
      );
    }
    if (s === 'bounced' || s === 'failed') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
          <span>Bounced</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        <Send className="h-3.5 w-3.5 text-[#1B3C8B]" />
        <span className="capitalize">{s}</span>
      </span>
    );
  };

  const recipients = Array.isArray(email?.to) ? email?.to.join(', ') : email?.to || '—';
  const lastEvent = (email?.last_event || email?.status || 'sent').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 text-[#1B3C8B] border border-blue-100">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Email Details</h2>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">ID: {emailId}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-slate-200/70 rounded text-slate-500 hover:text-slate-700 transition"
                  title="Copy Resend ID"
                >
                  {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#1B3C8B]" />
              <p className="text-xs font-medium">Fetching email payload from Resend...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-3">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load email payload</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {email?.subject || '(No Subject)'}
                    </h3>
                  </div>
                  <div>{getStatusBadge(lastEvent)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">To</span>
                    <span className="font-medium text-slate-800 break-all">{recipients}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">From</span>
                    <span className="font-medium text-slate-800 break-all">{email?.from || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Sent Date</span>
                    <span className="font-medium text-slate-800">
                      {email?.created_at
                        ? new Date(email.created_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'medium',
                          })
                        : '—'}
                    </span>
                  </div>
                  {email?.reply_to && email.reply_to.length > 0 && (
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">Reply-To</span>
                      <span className="font-medium text-slate-800">{email.reply_to.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Event Timeline
                </h4>
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-4 shadow-2xs">
                  <div className="flex items-start space-x-3">
                    <div className="p-1 rounded-full bg-blue-100 text-[#1B3C8B] mt-0.5">
                      <Send className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">Email Dispatched</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {email?.created_at ? new Date(email.created_at).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Accepted and processed by Resend mail gateway.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-1 rounded-full mt-0.5 ${
                        lastEvent === 'delivered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : lastEvent === 'suppressed' || lastEvent === 'complained'
                          ? 'bg-amber-100 text-amber-700'
                          : lastEvent === 'bounced'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lastEvent === 'delivered' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 capitalize">
                          Status: {lastEvent}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {lastEvent === 'delivered'
                          ? 'Email successfully delivered to recipient mailbox.'
                          : lastEvent === 'suppressed'
                          ? 'Email address was previously suppressed due to bounces or complaint.'
                          : lastEvent === 'bounced'
                          ? 'Mailbox rejected the message.'
                          : 'Processed via Resend.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Switcher */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-200">
                  <button
                    onClick={() => setActiveView('preview')}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
                      activeView === 'preview'
                        ? 'border-[#1B3C8B] text-[#1B3C8B]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>HTML Preview</span>
                  </button>
                  <button
                    onClick={() => setActiveView('text')}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
                      activeView === 'text'
                        ? 'border-[#1B3C8B] text-[#1B3C8B]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Plain Text</span>
                  </button>
                  <button
                    onClick={() => setActiveView('headers')}
                    className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
                      activeView === 'headers'
                        ? 'border-[#1B3C8B] text-[#1B3C8B]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Headers & JSON</span>
                  </button>
                </div>

                {/* Tab Views */}
                {activeView === 'preview' && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    {email?.html ? (
                      <iframe
                        srcDoc={email.html}
                        title="Email Preview"
                        className="w-full h-[400px] border-0"
                        sandbox="allow-same-origin"
                      />
                    ) : email?.text ? (
                      <div className="p-4 whitespace-pre-wrap font-sans text-xs text-slate-700 bg-slate-50 min-h-[200px]">
                        {email.text}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No HTML body was recorded for this email.
                      </div>
                    )}
                  </div>
                )}

                {activeView === 'text' && (
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-slate-200 font-mono text-xs shadow-2xs min-h-[250px]">
                    <pre className="whitespace-pre-wrap">
                      {email?.text || email?.html?.replace(/<[^>]*>?/gm, '') || '(No plain text available)'}
                    </pre>
                  </div>
                )}

                {activeView === 'headers' && (
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-emerald-400 font-mono text-xs shadow-2xs max-h-[400px]">
                    <pre>{JSON.stringify(email, null, 2)}</pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
