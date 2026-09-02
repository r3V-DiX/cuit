'use client';

// admin-ui/components/admin/AdminTopbar.tsx
// Page topbar: page title (from route), admin identity, RBAC role pill.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/lib/permissions-context';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'User Management',
  '/kyc': 'KYC Verification',
  '/jobs': 'Job Moderation',
  '/resumes': 'Resume Library',
  '/applications': 'Job Applications',
  '/subscriptions': 'Subscriptions & Discounts',
  '/subscriptions/payments': 'Payment History',
  '/audit-logs': 'Audit Logs',
  '/testimonials': 'Testimonials',
  '/contact': 'Contact Submissions',
  '/reports': 'Content Reports',
  '/admins': 'Admins & Access',
  '/settings': 'Platform Settings',
  '/policies': 'Policy & Rate Limits',
  '/announcements': 'Platform Announcements',
  '/emails': 'Broadcasts & Emails',
  '/blogs': 'Blogs & Articles',
  '/blacklist': 'Email & Domain Blacklist',
  '/suggestions': 'Search Suggestions',
  '/roles': 'Job Roles & Domains',
  '/system': 'System Health',
  '/profile': 'My Profile',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:
    'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-transparent',
  platform_admin: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewer: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

function getRoleColor(role: string): string {
  return (
    ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  );
}

function formatPathToTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Admin Console';
  const last = segments[segments.length - 1];
  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function AdminTopbar() {
  const pathname = usePathname();
  const { user, roles } = usePermissions();
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchedEmail, setFetchedEmail] = useState<string | null>(null);

  // Fetch identity from /api/admin/me if permissions context doesn't have it yet
  useEffect(() => {
    if (user) return;
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((body: { success: boolean; data?: { user?: { firstName?: string; lastName?: string; email?: string } } }) => {
        if (body.success && body.data?.user) {
          const first = body.data.user.firstName ?? '';
          const last = body.data.user.lastName ?? '';
          setFetchedName(`${first} ${last}`.trim() || 'Admin');
          setFetchedEmail(body.data.user.email ?? '');
        }
      })
      .catch(() => {});
  }, [user]);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : fetchedName ?? '—';
  const displayEmail = user?.email ?? fetchedEmail ?? '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Resolve page title from pathname
  const title =
    Object.entries(ROUTE_TITLES)
      .sort((a, b) => b[0].length - a[0].length) // longest match first
      .find(([path]) => pathname === path || pathname.startsWith(path + '/'))
      ?.[1] ?? formatPathToTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left: page title */}
      <div className="pl-14 lg:pl-0">
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>

      {/* Right: identity */}
      <div className="flex items-center gap-3">
        {/* Role pills */}
        {roles.slice(0, 2).map((role) => (
          <span
            key={role}
            className={`hidden rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wide sm:inline-flex ${getRoleColor(role)}`}
          >
            {role.replace('_', ' ')}
          </span>
        ))}

        {/* Avatar + name */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-50"
          title="My Profile"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
            {initials || '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500">{displayEmail}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
