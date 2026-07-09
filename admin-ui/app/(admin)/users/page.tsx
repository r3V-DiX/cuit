'use client';

// admin-ui/app/(admin)/users/page.tsx
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ACTIONS } from '@/lib/permissions';
import type { User, PaginatedResponse } from '@/lib/types';
import RequirePermission from '@/components/ui/RequirePermission';
import NoAccess from '@/components/ui/NoAccess';
import Table from '@/components/ui/Table';
import PaginationBar from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Users as UsersIcon } from 'lucide-react';
import { format } from 'date-fns';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const q = searchParams.get('q') ?? '';
  const role = searchParams.get('role') ?? '';
  const status = searchParams.get('status') ?? '';

  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        if (q) params.set('q', q);
        if (role) params.set('role', role);
        if (status) params.set('status', status);

        const res = await api.get<PaginatedResponse<User>>(`/api/admin/users?${params.toString()}`);
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [page, q, role, status]);

  const handleRowClick = (user: User) => {
    router.push(`/users/${user.id}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <RequirePermission action={ACTIONS.USERS.VIEW} fallback={<NoAccess />}>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500">Manage seekers, employers, and admins.</p>
        </div>

        <FilterBar
          searchKey="q"
          searchPlaceholder="Search email or name..."
          filters={[
            {
              key: 'role',
              label: 'All Roles',
              options: [
                { label: 'Seeker', value: 'SEEKER' },
                { label: 'Employer', value: 'EMPLOYER' },
                { label: 'Admin', value: 'ADMIN' },
              ],
            },
            {
              key: 'status',
              label: 'All Statuses',
              options: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Suspended', value: 'SUSPENDED' },
                { label: 'Deleted', value: 'DELETED' },
              ],
            },
          ]}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : loading ? (
          <SkeletonTable rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title="No users found"
            description="Adjust your search or filters to find what you're looking for."
          />
        ) : (
          <div className="space-y-4">
            <Table
              data={data.items}
              getRowKey={(u) => u.id}
              onRowClick={handleRowClick}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (u) => (
                    <div>
                      <p className="font-medium text-slate-900">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Role',
                  render: (u) => <StatusBadge status={u.role} />,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (u) => <StatusBadge status={u.status} />,
                },
                {
                  key: 'joined',
                  header: 'Joined',
                  render: (u) => (
                    <span className="text-sm text-slate-600">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </span>
                  ),
                },
              ]}
            />
            <PaginationBar
              pagination={data.pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<SkeletonTable rows={10} />}>
      <UsersPageContent />
    </Suspense>
  );
}
