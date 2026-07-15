// admin-ui/app/(admin)/layout.tsx
// Admin shell: sidebar + topbar. PermissionsProvider lives here (not root layout)
// so the login page has no permissions context overhead.

import { AdminSidebar } from '@/components/admin';
import { AdminTopbar } from '@/components/admin';
import { PermissionsProvider } from '@/lib/permissions-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
