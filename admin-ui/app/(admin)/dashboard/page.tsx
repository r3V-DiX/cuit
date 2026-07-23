'use client';

// admin-ui/app/(admin)/dashboard/page.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type {
  DashboardStats,
  RevenueAnalytics,
  SubscriptionAnalytics,
  UserAnalytics,
  JobAnalytics,
  ApplicationAnalytics,
  AnalyticsPeriod,
} from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { StatCard } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { Users, Briefcase, ShieldCheck, FileText, CreditCard } from 'lucide-react';

// Validated categorical palette (dataviz skill) — fixed slot order, never reassigned per chart.
const BLUE = '#2a78d6';
const AQUA = '#1baf7a';
const YELLOW = '#eda100';
const GREEN = '#008300';
const VIOLET = '#4a3aa7';
const RED = '#e34948';
const PIE_COLORS = [BLUE, AQUA, YELLOW, GREEN, VIOLET, RED];

const AXIS_TICK = { fill: '#898781', fontSize: 12 };
const GRID_STROKE = '#e1e0d9';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

function formatDateTick(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRupees(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionAnalytics | null>(null);
  const [users, setUsers] = useState<UserAnalytics | null>(null);
  const [jobs, setJobs] = useState<JobAnalytics | null>(null);
  const [applications, setApplications] = useState<ApplicationAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get<DashboardStats>('/api/admin/dashboard');
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const loadAnalytics = useCallback(async (p: AnalyticsPeriod) => {
    setAnalyticsLoading(true);
    try {
      const [rev, subs, u, j, apps] = await Promise.all([
        api.get<RevenueAnalytics>(`/api/admin/analytics/revenue?period=${p}`),
        api.get<SubscriptionAnalytics>(`/api/admin/analytics/subscriptions?period=${p}`),
        api.get<UserAnalytics>(`/api/admin/analytics/users?period=${p}`),
        api.get<JobAnalytics>(`/api/admin/analytics/jobs?period=${p}`),
        api.get<ApplicationAnalytics>(`/api/admin/analytics/applications?period=${p}`),
      ]);
      setRevenue(rev);
      setSubscriptions(subs);
      setUsers(u);
      setJobs(j);
      setApplications(apps);
    } catch {
      // Analytics charts are supplementary — the stat cards above still work if this fails.
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(period);
  }, [period, loadAnalytics]);

  return (
    <RequirePermission action={ACTIONS.DASHBOARD.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Platform Overview</h2>
          <p className="text-sm text-slate-500">Real-time statistics across all modules.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading || !stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Users"
              value={stats.users.total}
              icon={<Users className="h-5 w-5" />}
              accent="blue"
              note={`${stats.users.seekers} Seekers, ${stats.users.employers} Employers`}
            />
            <StatCard
              label="Active Jobs"
              value={stats.jobs.active}
              icon={<Briefcase className="h-5 w-5" />}
              accent="green"
              note={`${stats.jobs.pendingApproval} pending approval`}
            />
            <StatCard
              label="Pending KYC"
              value={stats.kyc.pendingReview}
              icon={<ShieldCheck className="h-5 w-5" />}
              accent={stats.kyc.pendingReview > 0 ? 'amber' : 'slate'}
              note="Awaiting admin review"
            />
            <StatCard
              label="Total Applications"
              value={stats.applications.total}
              icon={<FileText className="h-5 w-5" />}
              accent="slate"
              note="Across all jobs"
            />
            <StatCard
              label="Active Subscriptions"
              value={stats.subscriptions.active}
              icon={<CreditCard className="h-5 w-5" />}
              accent="blue"
              note="Employers with active plans"
            />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Trends</h3>
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {applications && (
            <p className="text-xs text-slate-500">
              {applications.totalCount.toLocaleString()} applications this period · {applications.conversionRate}%
              conversion from job views
            </p>
          )}

          {analyticsLoading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Revenue over time">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue?.daily ?? []} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDateTick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatRupees} tick={AXIS_TICK} axisLine={false} tickLine={false} width={56} />
                    <Tooltip
                      formatter={(value) => [formatRupees(Number(value)), 'Revenue']}
                      labelFormatter={(label) => formatDateTick(String(label))}
                    />
                    <Area type="monotone" dataKey="revenuePaise" stroke={BLUE} strokeWidth={2} fill={BLUE} fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="User signups by role">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={users?.daily ?? []} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDateTick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip labelFormatter={(label) => formatDateTick(String(label))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="seekers" name="Seekers" stroke={BLUE} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="employers" name="Employers" stroke={AQUA} strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Jobs by status">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={jobs?.daily ?? []} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDateTick} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                    <Tooltip labelFormatter={(label) => formatDateTick(String(label))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="pending" name="Pending" stackId="status" stroke={BLUE} fill={BLUE} fillOpacity={0.75} />
                    <Area type="monotone" dataKey="approved" name="Approved" stackId="status" stroke={AQUA} fill={AQUA} fillOpacity={0.75} />
                    <Area type="monotone" dataKey="rejected" name="Rejected" stackId="status" stroke={YELLOW} fill={YELLOW} fillOpacity={0.75} />
                    <Area type="monotone" dataKey="expired" name="Expired" stackId="status" stroke={GREEN} fill={GREEN} fillOpacity={0.75} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Subscriptions by plan">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value, name) => [`${value} active`, String(name)]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Pie
                      data={subscriptions?.byPlan ?? []}
                      dataKey="count"
                      nameKey="package"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {(subscriptions?.byPlan ?? []).map((entry, i) => (
                        <Cell key={entry.package} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </div>
      </div>
    </RequirePermission>
  );
}
