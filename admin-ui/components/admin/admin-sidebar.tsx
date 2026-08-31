'use client';

// admin-ui/components/admin/AdminSidebar.tsx
// Permission-gated navigation sidebar, cloned from EmployerSidebar pattern.
// Nav items are ABSENT (not disabled) for admins who lack the required permission.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  CreditCard,
  KeyRound,
  ScrollText,
  Quote,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Mail,
  Settings2,
  Flag,
  UserCog,
  SlidersHorizontal,
  Megaphone,
  ShieldBan,
  SearchCode,
  Tag,
  Server,
  Percent,
  FileText,
  ClipboardList,
  SendHorizontal,
} from 'lucide-react';
import { useModal } from '@/components/ui';
import { useToast } from '@/components/ui';
import { usePermissions } from '@/lib/permissions-context';
import { ACTIONS } from '@/lib';
import { getCsrfToken } from '@/lib/api';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  action: string;
  badge?: number;
}



export default function AdminSidebar() {
  const pathname = usePathname();
  const { has } = usePermissions();
  const { openModal, closeModal } = useModal();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [pendingJobs, setPendingJobs] = useState(0);

  // Close mobile overlay on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes mobile overlay
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  // Fetch dashboard stats for KYC/Jobs badge counts
  useEffect(() => {
    if (!has(ACTIONS.DASHBOARD.VIEW)) return;
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((body: { success: boolean; data?: { kyc?: { pendingReview?: number }; jobs?: { pendingApproval?: number } } }) => {
        if (body.success && body.data) {
          setPendingKyc(body.data.kyc?.pendingReview ?? 0);
          setPendingJobs(body.data.jobs?.pendingApproval ?? 0);
        }
      })
      .catch(() => {});
  }, [has]);

  const ALL_NAV_ITEMS: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      action: ACTIONS.DASHBOARD.VIEW,
    },
    {
      label: 'Users',
      href: '/users',
      icon: <Users className="h-5 w-5" />,
      action: ACTIONS.USERS.VIEW,
    },
    {
      label: 'KYC',
      href: '/kyc',
      icon: <ShieldCheck className="h-5 w-5" />,
      action: ACTIONS.KYC.VIEW,
      badge: pendingKyc,
    },
    {
      label: 'Jobs',
      href: '/jobs',
      icon: <Briefcase className="h-5 w-5" />,
      action: ACTIONS.JOBS.VIEW,
      badge: pendingJobs,
    },
    {
      label: 'Resumes',
      href: '/resumes',
      icon: <FileText className="h-5 w-5" />,
      action: ACTIONS.RESUMES.VIEW,
    },
    {
      label: 'Applications',
      href: '/applications',
      icon: <ClipboardList className="h-5 w-5" />,
      action: ACTIONS.APPLICATIONS.VIEW,
    },
    {
      label: 'Subscriptions',
      href: '/subscriptions',
      icon: <CreditCard className="h-5 w-5" />,
      action: ACTIONS.SUBSCRIPTIONS.VIEW,
    },
    {
      label: 'Discounts',
      href: '/discounts',
      icon: <Percent className="h-5 w-5" />,
      action: ACTIONS.DISCOUNTS.VIEW,
    },
    {
      label: 'RBAC',
      href: '/rbac',
      icon: <KeyRound className="h-5 w-5" />,
      action: ACTIONS.RBAC.VIEW,
    },
    {
      label: 'Audit Logs',
      href: '/audit-logs',
      icon: <ScrollText className="h-5 w-5" />,
      action: ACTIONS.AUDIT.VIEW,
    },
    {
      label: 'Testimonials',
      href: '/testimonials',
      icon: <Quote className="h-5 w-5" />,
      action: ACTIONS.TESTIMONIALS.VIEW,
    },
    {
      label: 'Contact',
      href: '/contact',
      icon: <Mail className="h-5 w-5" />,
      action: ACTIONS.CONTACT.VIEW,
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <Flag className="h-5 w-5" />,
      action: ACTIONS.REPORTS.VIEW,
    },
    {
      label: 'Admins',
      href: '/admins',
      icon: <UserCog className="h-5 w-5" />,
      action: ACTIONS.ADMINS.VIEW,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings2 className="h-5 w-5" />,
      action: ACTIONS.SETTINGS.MANAGE,
    },
    {
      label: 'Policies',
      href: '/policies',
      icon: <SlidersHorizontal className="h-5 w-5" />,
      action: ACTIONS.POLICIES.MANAGE,
    },
    {
      label: 'Announcements',
      href: '/announcements',
      icon: <Megaphone className="h-5 w-5" />,
      action: ACTIONS.ANNOUNCEMENTS.MANAGE,
    },
    {
      label: 'Broadcasts & Emails',
      href: '/emails',
      icon: <SendHorizontal className="h-5 w-5" />,
      action: ACTIONS.EMAILS.VIEW,
    },
    {
      label: 'Blacklist',
      href: '/blacklist',
      icon: <ShieldBan className="h-5 w-5" />,
      action: ACTIONS.BLACKLIST.MANAGE,
    },
    {
      label: 'Suggestions',
      href: '/suggestions',
      icon: <SearchCode className="h-5 w-5" />,
      action: ACTIONS.SUGGESTIONS.MANAGE,
    },
    {
      label: 'Job Roles',
      href: '/roles',
      icon: <Tag className="h-5 w-5" />,
      action: ACTIONS.ROLES.MANAGE,
    },
    {
      label: 'System Health',
      href: '/system',
      icon: <Server className="h-5 w-5" />,
      action: ACTIONS.DASHBOARD.VIEW,
    },
  ];

  // Filter by permissions — items are absent, not disabled
  const navItems = ALL_NAV_ITEMS.filter((item) => has(item.action));

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrf ? { 'x-csrf-token': csrf } : {},
      });
      if (!res.ok) {
        toast({ type: 'error', message: 'Sign out failed — please try again.' });
        return;
      }
    } catch {
      toast({ type: 'error', message: 'Sign out failed — please try again.' });
      return;
    }
    // Backend clears the httpOnly session cookie; clear the readable CSRF
    // cookie here too so no stale cookie remains client-side either.
    document.cookie = 'admin_csrf_token=; Max-Age=0; path=/';
    toast({ type: 'info', message: 'You have been signed out.' });
    window.location.href = '/login';
  }

  function confirmSignOut() {
    openModal({
      variant: 'danger',
      title: 'Sign out?',
      description:
        "You'll be redirected to the login page. Any unsaved changes will be lost.",
      confirmLabel: 'Sign out',
      onConfirm: async () => {
        closeModal();
        await handleSignOut();
      },
    });
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div
        className={`flex items-center border-b border-slate-200 px-4 py-4 ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
          <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold tracking-tight text-slate-900">
              Cykruit
            </p>
            <p className="font-mono text-[10px] tracking-widest text-blue-500">
              ADMIN CONSOLE
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : 'gap-3'
                  } ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {active && (
                    <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
                  )}
                  <span
                    className={`shrink-0 ${
                      active
                        ? 'text-blue-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed &&
                    item.badge !== undefined &&
                    item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 font-mono text-[10px] font-bold text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / sign out */}
      <div className="border-t border-slate-200 px-3 py-3">
        <button
          onClick={confirmSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-lg lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5 text-slate-700" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:text-slate-600"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`relative hidden flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:flex ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
      </aside>
    </>
  );
}
