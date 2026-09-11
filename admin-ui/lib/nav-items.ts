// admin-ui/lib/nav-items.ts
// Single source of truth for every admin page (and its tabs), shared by
// AdminSidebar (navigation) and GlobalSearch (jump-to-page search).

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  CreditCard,
  ScrollText,
  Quote,
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
  FileText,
  ClipboardList,
  SendHorizontal,
  BookOpen,
  Image as ImageIcon,
  Calendar,
} from 'lucide-react';
import { ACTIONS } from './permissions';

export interface NavChild {
  label: string;
  /** Tab key this sub-link selects, e.g. /subscriptions?tab=packages */
  tab: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Item is visible if the admin holds this action, or any one of these actions. */
  action: string | string[];
  /** This item's page has tabs — shown as collapsible sub-links (?tab=) and as separate search results. */
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, action: ACTIONS.DASHBOARD.VIEW },
  { label: 'KYC', href: '/kyc', icon: ShieldCheck, action: ACTIONS.KYC.VIEW },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, action: ACTIONS.JOBS.VIEW },
  { label: 'Users', href: '/users', icon: Users, action: ACTIONS.USERS.VIEW },
  { label: 'Applications', href: '/applications', icon: ClipboardList, action: ACTIONS.APPLICATIONS.VIEW },
  { label: 'Content Reports', href: '/reports', icon: Flag, action: ACTIONS.REPORTS.VIEW },
  { label: 'Resumes', href: '/resumes', icon: FileText, action: ACTIONS.RESUMES.VIEW },
  {
    label: 'Subscriptions & Discounts',
    href: '/subscriptions',
    icon: CreditCard,
    action: [ACTIONS.SUBSCRIPTIONS.VIEW, ACTIONS.DISCOUNTS.VIEW],
    children: [
      { label: 'Packages', tab: 'packages' },
      { label: 'Employer Subscriptions', tab: 'employers' },
      { label: 'Payment History', tab: 'payments' },
      { label: 'Discounts', tab: 'discounts' },
    ],
  },
  { label: 'Testimonials', href: '/testimonials', icon: Quote, action: ACTIONS.TESTIMONIALS.VIEW },
  { label: 'Blogs & Articles', href: '/blogs', icon: BookOpen, action: ACTIONS.BLOGS.VIEW },
  { label: "What's New", href: '/events', icon: Calendar, action: ACTIONS.EVENTS.VIEW },
  { label: 'Ads', href: '/ads', icon: ImageIcon, action: ACTIONS.ADS.VIEW },
  { label: 'Announcements', href: '/announcements', icon: Megaphone, action: ACTIONS.ANNOUNCEMENTS.MANAGE },
  { label: 'Broadcasts & Emails', href: '/emails', icon: SendHorizontal, action: ACTIONS.EMAILS.VIEW },
  { label: 'Contact', href: '/contact', icon: Mail, action: ACTIONS.CONTACT.VIEW },
  { label: 'Suggestions', href: '/suggestions', icon: SearchCode, action: ACTIONS.SUGGESTIONS.MANAGE },
  { label: 'Blacklist', href: '/blacklist', icon: ShieldBan, action: ACTIONS.BLACKLIST.MANAGE },
  { label: 'Job Roles', href: '/roles', icon: Tag, action: ACTIONS.ROLES.MANAGE },
  {
    label: 'Admins & Access',
    href: '/admins',
    icon: UserCog,
    action: [ACTIONS.ADMINS.VIEW, ACTIONS.RBAC.VIEW, ACTIONS.EMPLOYER_RBAC.VIEW],
    children: [
      { label: 'Roles', tab: 'roles' },
      { label: 'Permissions Map', tab: 'permissions' },
      { label: 'Employer Permissions', tab: 'employer-permissions' },
      { label: 'Admins', tab: 'admins' },
      { label: 'Pending Invitations', tab: 'pending' },
    ],
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    icon: ScrollText,
    action: ACTIONS.AUDIT.VIEW,
    children: [
      { label: 'Audit Logs', tab: 'audit' },
      { label: 'System Logs', tab: 'system' },
      { label: 'Admin Activity Logs', tab: 'admin' },
    ],
  },
  { label: 'Policies', href: '/policies', icon: SlidersHorizontal, action: ACTIONS.POLICIES.MANAGE },
  { label: 'System Health', href: '/system', icon: Server, action: ACTIONS.DASHBOARD.VIEW },
  { label: 'Platform Settings', href: '/platform-settings', icon: Settings2, action: ACTIONS.SETTINGS.MANAGE },
];
