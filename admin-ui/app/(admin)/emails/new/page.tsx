'use client';

// admin-ui/app/(admin)/emails/new/page.tsx
import Link from 'next/link';
import { ACTIONS } from '@/lib';
import { RequirePermission, NoAccess } from '@/components/ui';
import { ChevronLeft, SendHorizontal } from 'lucide-react';
import EmailComposer from '../_components/email-composer';

function NewEmailPageContent() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href="/emails"
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 mb-2 font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
          <SendHorizontal className="h-7 w-7 text-blue-800" />
          <span>Compose New Broadcast</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Draft and dispatch emails to targeted platform user segments or custom recipient lists.
        </p>
      </div>

      <EmailComposer />
    </div>
  );
}

export default function NewEmailPage() {
  return (
    <RequirePermission action={ACTIONS.EMAILS.SEND} fallback={<NoAccess />}>
      <NewEmailPageContent />
    </RequirePermission>
  );
}
