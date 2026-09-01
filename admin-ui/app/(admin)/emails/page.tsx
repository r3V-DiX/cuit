'use client';

// admin-ui/app/(admin)/emails/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ACTIONS } from '@/lib';
import { usePermissions } from '@/lib/permissions-context';
import type { AdminEmailCampaign, PaginatedResponse } from '@/lib';
import {
  RequirePermission,
  NoAccess,
  PaginationBar,
  FilterBar,
  StatusBadge,
  SkeletonTable,
  Button,
} from '@/components/ui';
import {
  SendHorizontal,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Activity,
  Layers,
  ShieldAlert,
  Inbox,
  Radio,
} from 'lucide-react';
import { ResendLogsTab } from './_components/resend-logs-tab';
import { SuppressionsTab } from './_components/suppressions-tab';

function CampaignsTabContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('q') ?? '';

  const [data, setData] = useState<PaginatedResponse<AdminEmailCampaign> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canSend = has(ACTIONS.EMAILS.SEND);

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (status) params.set('status', status);
        if (search) params.set('search', search);

        const res = await api.get<PaginatedResponse<AdminEmailCampaign>>(
          `/api/admin/emails/campaigns?${params.toString()}`,
        );
        setData(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load email campaigns');
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, [page, status, search]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const campaigns = data?.items ?? [];
  const totalCampaigns = data?.pagination?.total ?? 0;
  const totalDispatched = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hallmark Tactile Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaigns */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Broadcasts
            </span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-800">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {totalCampaigns}
            </span>
            <span className="text-[11px] font-medium text-slate-400">All-time</span>
          </div>
        </div>

        {/* Delivered Emails */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Delivered
            </span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-emerald-700 font-mono tabular-nums">
              {totalDispatched.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-emerald-600">Dispatched</span>
          </div>
        </div>

        {/* Failures */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failures
            </span>
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-700">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-rose-700 font-mono tabular-nums">
              {totalFailed}
            </span>
            <span className="text-[11px] font-medium text-slate-400">Bounced / Errored</span>
          </div>
        </div>

        {/* Mail Engine Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mail Gateway
            </span>
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-900">Active (Resend)</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchKey="q"
        searchPlaceholder="Search broadcasts..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Queued', value: 'QUEUED' },
              { label: 'Processing', value: 'PROCESSING' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Partially Failed', value: 'PARTIALLY_FAILED' },
              { label: 'Failed', value: 'FAILED' },
            ],
          },
        ]}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && <SkeletonTable rows={6} />}

      {/* Empty state */}
      {!loading && campaigns.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1B3C8B] mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Email Campaigns Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            You have not dispatched any email broadcasts matching your current filters. Create your first campaign to get started.
          </p>
          {canSend && (
            <Link href="/emails/new">
              <Button
                variant="primary"
                className="bg-[#1B3C8B] hover:bg-[#142e6d] text-white px-4 py-2 text-xs font-semibold rounded-lg transition inline-flex items-center space-x-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Broadcast</span>
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Campaigns Table */}
      {!loading && campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Subject & Campaign ID</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Delivery Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs">{campaign.subject}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ID: {campaign.id.substring(0, 8)}...
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {campaign.recipientType === 'SEGMENT' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1B3C8B] font-medium text-[11px] border border-blue-200/80">
                          <Users className="h-3 w-3" />
                          <span>Segment: {campaign.segmentTarget || 'ALL'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200">
                          <Mail className="h-3 w-3" />
                          <span>Custom List ({campaign.totalRecipients})</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-900 tabular-nums font-medium">
                        {campaign.sentCount} / {campaign.totalRecipients} sent
                      </div>
                      {campaign.failedCount > 0 && (
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          {campaign.failedCount} failed
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={campaign.status} />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {campaign.creator?.firstName} {campaign.creator?.lastName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{campaign.creator?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(campaign.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/emails/${campaign.id}`}
                        className="inline-flex items-center space-x-1 text-[#1B3C8B] hover:text-blue-950 font-semibold hover:underline text-xs"
                      >
                        <span>Report</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <div className="border-t border-slate-100 p-2">
              <PaginationBar
                pagination={data.pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmailsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { has } = usePermissions();

  const currentTab = searchParams.get('tab') || 'logs';
  const canSend = has(ACTIONS.EMAILS.SEND);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-[#1B3C8B] border border-blue-100">
              <SendHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Email Center & Logs
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time transactional email activity, delivery statuses, campaigns, and suppressions.
              </p>
            </div>
          </div>
        </div>

        {canSend && (
          <Link href="/emails/new">
            <Button
              variant="primary"
              className="flex items-center space-x-2 shadow-xs bg-[#1B3C8B] hover:bg-[#142e6d] text-white px-4 py-2 text-xs font-semibold rounded-lg transition"
            >
              <Plus className="h-4 w-4" />
              <span>Compose Broadcast</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Main Tabs Navigation (Resend Style) */}
      <div className="flex items-center space-x-1 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            currentTab === 'logs'
              ? 'border-[#1B3C8B] text-[#1B3C8B] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Live Email Logs (Resend)</span>
        </button>

        <button
          onClick={() => handleTabChange('campaigns')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            currentTab === 'campaigns'
              ? 'border-[#1B3C8B] text-[#1B3C8B] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Broadcast Campaigns</span>
        </button>

        <button
          onClick={() => handleTabChange('suppressions')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            currentTab === 'suppressions'
              ? 'border-[#1B3C8B] text-[#1B3C8B] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Suppressions</span>
        </button>
      </div>

      {/* Active Tab View */}
      {currentTab === 'logs' && <ResendLogsTab />}
      {currentTab === 'campaigns' && <CampaignsTabContent />}
      {currentTab === 'suppressions' && <SuppressionsTab />}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <RequirePermission action={ACTIONS.EMAILS.VIEW} fallback={<NoAccess />}>
      <Suspense fallback={<SkeletonTable rows={6} />}>
        <EmailsPageContent />
      </Suspense>
    </RequirePermission>
  );
}
