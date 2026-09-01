'use client';

// admin-ui/app/(admin)/admins/_components/pending-invites-tab.tsx
// Lists PENDING AdminInvite rows with a Revoke action (sets status -> REVOKED,
// see admins.service.ts's revokeInvite). Re-inviting a revoked email is still
// allowed and reuses the same row (email is unique) via createInvite's upsert.

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib';
import type { AdminInvite, PaginatedResponse } from '@/lib';
import { Table } from '@/components/ui';
import { PaginationBar } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { MailX, MailWarning } from 'lucide-react';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

interface PendingInvitesTabProps {
  canManage: boolean;
}

export default function PendingInvitesTab({ canManage }: PendingInvitesTabProps) {
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminInvite> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    async function loadInvites() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<PaginatedResponse<AdminInvite>>(
          `/api/admin/admins/invites?page=${page}`,
        );
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pending invites');
      } finally {
        setLoading(false);
      }
    }
    loadInvites();
  }, [page, reloadKey]);

  const handleRevoke = (invite: AdminInvite) => {
    openModal({
      title: 'Revoke invite?',
      description: `The invite sent to "${invite.email}" will no longer be usable. You can invite them again afterward.`,
      variant: 'danger',
      confirmLabel: 'Revoke',
      onConfirm: async () => {
        try {
          await api.del(`/api/admin/admins/invites/${invite.id}`);
          toast({ type: 'success', message: 'Invite revoked.' });
          refresh();
        } catch (err) {
          toast({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to revoke invite',
          });
        } finally {
          closeModal();
        }
      },
    });
  };

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (loading) return <SkeletonTable rows={10} />;

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<MailWarning className="h-6 w-6" />}
        title="No pending invitations"
        description="Every sent invite has been accepted, expired, or revoked."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Table
        data={data.items}
        getRowKey={(i) => i.id}
        columns={[
          {
            key: 'email',
            header: 'Email',
            render: (i) => <span className="font-medium text-slate-900">{i.email}</span>,
          },
          {
            key: 'role',
            header: 'Role',
            render: (i) =>
              i.role ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {i.role.name}
                </span>
              ) : (
                <span className="text-xs text-slate-400">No role assigned</span>
              ),
          },
          {
            key: 'invitedBy',
            header: 'Invited By',
            render: (i) =>
              i.inviter ? (
                <span className="text-slate-600">
                  {i.inviter.firstName} {i.inviter.lastName}
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              ),
          },
          {
            key: 'expiresAt',
            header: 'Expires',
            render: (i) => <span className="text-slate-600">{formatDate(i.expiresAt)}</span>,
          },
          ...(canManage
            ? [
                {
                  key: 'actions',
                  header: '',
                  className: 'text-right',
                  render: (i: AdminInvite) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRevoke(i)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Revoke invite"
                      >
                        <MailX className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
      <PaginationBar pagination={data.pagination} onPageChange={setPage} />
    </div>
  );
}
