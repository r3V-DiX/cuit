'use client';

// admin-ui/app/(admin)/system/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib';
import { ACTIONS } from '@/lib';
import type { SystemHealth, ServiceHealth, ServiceStatus } from '@/lib';
import { RequirePermission } from '@/components/ui';
import { NoAccess } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { Database, RefreshCw, Server } from 'lucide-react';

const AUTO_REFRESH_MS = 60_000;

const STATUS_DOT: Record<ServiceStatus, string> = {
  up: 'bg-green-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  up: 'Up',
  degraded: 'Degraded',
  down: 'Down',
};

function formatServiceName(name: string) {
  return name
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function ServiceCard({ service }: { service: ServiceHealth }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[service.status]}`} />
          <p className="text-sm font-medium text-slate-900">{formatServiceName(service.name)}</p>
        </div>
        <span className="font-mono text-[10px] uppercase text-slate-400">{STATUS_LABEL[service.status]}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {service.latencyMs !== null ? `${service.latencyMs}ms` : 'No response'}
      </p>
      {service.url && <p className="mt-1 truncate font-mono text-[10px] text-slate-400">{service.url}</p>}
    </div>
  );
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    try {
      const data = await api.get<SystemHealth>('/api/admin/system/health');
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system health');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <RequirePermission action={ACTIONS.DASHBOARD.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
            <p className="text-sm text-slate-500">
              Live status of every microservice, Redis, and the database. Auto-refreshes every 60s.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : loading || !health ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Database</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[health.db.status]}`} />
                    <span className="text-xs text-slate-500">{STATUS_LABEL[health.db.status]}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Server className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Redis</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[health.redis.status]}`} />
                    <span className="text-xs text-slate-500">{STATUS_LABEL[health.redis.status]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Microservices</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {health.services.map((s) => (
                  <ServiceCard key={s.name} service={s} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
