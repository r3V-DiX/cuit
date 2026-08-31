'use client';

// admin-ui/app/(admin)/emails/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ACTIONS } from '@/lib';
import type { AdminEmailCampaign } from '@/lib';
import {
  RequirePermission,
  NoAccess,
  StatusBadge,
  Button,
} from '@/components/ui';
import {
  ChevronLeft,
  Mail,
  Users,
  Copy,
  FileCode,
  Loader2,
} from 'lucide-react';

function CampaignDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<AdminEmailCampaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawHtml, setShowRawHtml] = useState<boolean>(false);
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');

  useEffect(() => {
    async function loadCampaign() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<AdminEmailCampaign>(
          `/api/admin/emails/campaigns/${campaignId}`,
        );
        setCampaign(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    }
    if (campaignId) loadCampaign();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        <p className="text-sm text-slate-500 font-medium">Loading campaign details...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Link
          href="/emails"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <h2 className="font-semibold text-base">Error Loading Campaign</h2>
          <p className="text-xs mt-1">{error || 'Campaign not found.'}</p>
        </div>
      </div>
    );
  }

  const successRate =
    campaign.totalRecipients > 0
      ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
      : 0;

  const logs = campaign.recipientLogs || [];
  const filteredLogs = logs.filter((log) => {
    if (recipientFilter === 'SENT') return log.status === 'SENT';
    if (recipientFilter === 'FAILED') return log.status === 'FAILED';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/emails"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 mb-2 font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.subject}</h1>
            <p className="text-xs font-mono text-slate-400 mt-1">Campaign ID: {campaign.id}</p>
          </div>

          <div className="flex items-center space-x-3">
            <StatusBadge status={campaign.status} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/emails/new')}
              className="flex items-center space-x-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>New Broadcast</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Audience</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{campaign.totalRecipients}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-green-600">Delivered</span>
          <p className="text-2xl font-bold text-green-700 mt-1">{campaign.sentCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-red-600">Failed</span>
          <p className="text-2xl font-bold text-red-700 mt-1">{campaign.failedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-blue-600">Success Rate</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">{successRate}%</p>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 border-b pb-3">Campaign Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Targeting Mode:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {campaign.recipientType === 'SEGMENT'
                ? `Audience Segment: ${campaign.segmentTarget || 'ALL'}`
                : 'Custom Recipient List'}
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Author / Admin:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {campaign.creator?.firstName} {campaign.creator?.lastName} ({campaign.creator?.email})
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Created At:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {new Date(campaign.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <span className="text-slate-500 font-medium">Completed At:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {campaign.completedAt
                ? new Date(campaign.completedAt).toLocaleString()
                : 'In progress / Queued'}
            </p>
          </div>
        </div>
      </div>

      {/* Email Body Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-semibold text-slate-800">Email Body & Template</h3>
          <button
            type="button"
            onClick={() => setShowRawHtml(!showRawHtml)}
            className="flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-medium"
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>{showRawHtml ? 'Show Rendered HTML' : 'View Raw HTML'}</span>
          </button>
        </div>

        {showRawHtml ? (
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-80">
            {campaign.bodyHtml}
          </pre>
        ) : (
          <div
            className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed prose max-w-none"
            dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
          />
        )}
      </div>

      {/* Recipient Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-800" />
            <span>Recipient Delivery Log ({logs.length})</span>
          </h3>

          <div className="flex items-center space-x-1.5 text-xs bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'SENT', 'FAILED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setRecipientFilter(mode)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  recipientFilter === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No recipient log entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                  <th className="py-2.5 px-3">Recipient Email</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sent Time / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-slate-900">{log.email}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.name || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.status === 'SENT'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {log.error ? (
                        <span className="text-red-600 font-mono text-[11px]">{log.error}</span>
                      ) : log.sentAt ? (
                        new Date(log.sentAt).toLocaleTimeString()
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <RequirePermission action={ACTIONS.EMAILS.VIEW} fallback={<NoAccess />}>
      <CampaignDetailPageContent />
    </RequirePermission>
  );
}
