// admin-ui/components/ui/StatusBadge.tsx
// Single status → color mapping used everywhere in admin-ui.
// Ref: UI/UX Brief §5.

import type {
  AccountStatus,
  VerificationStatus,
  JobStatus,
  AuditResult,
  RiskLevel,
  SubscriptionStatus,
  UserRole,
} from '@/lib';

type StatusValue =
  | AccountStatus
  | VerificationStatus
  | JobStatus
  | AuditResult
  | RiskLevel
  | SubscriptionStatus
  | UserRole
  | string;

interface StatusBadgeProps {
  status: StatusValue;
  className?: string;
}

const STATUS_MAP: Record<string, string> = {
  // Amber — pending/in-review
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  // Blue — applied/submitted
  APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
  // Green — approved/active/success
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  SUCCESS: 'bg-green-50 text-green-700 border-green-200',
  PUBLISHED: 'bg-green-50 text-green-700 border-green-200',
  SHORTLISTED: 'bg-green-50 text-green-700 border-green-200',
  // Red — rejected/suspended/failure/denied/cancelled
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  FAILURE: 'bg-red-50 text-red-700 border-red-200',
  DENIED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-red-50 text-red-700 border-red-200',
  // Slate — draft/inactive/closed/expired/deleted
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
  DELETED: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDING_DELETION: 'bg-slate-100 text-slate-600 border-slate-200',
  RESOLVED_REMOVED: 'bg-green-50 text-green-700 border-green-200',
  RESOLVED_DISMISSED: 'bg-slate-100 text-slate-600 border-slate-200',
  // Risk levels
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200 font-bold',
  // User roles
  ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
  EMPLOYER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  SEEKER: 'bg-slate-100 text-slate-600 border-slate-200',
  // Email Campaign statuses
  QUEUED: 'bg-blue-50 text-blue-700 border-blue-200',
  PROCESSING: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  PARTIALLY_FAILED: 'bg-amber-50 text-amber-700 border-amber-200',
  // Payment/order refund state
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
  // Employer team member roles
  OWNER: 'bg-blue-50 text-blue-700 border-blue-200',
  HIRING_MANAGER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  RECRUITER: 'bg-slate-100 text-slate-600 border-slate-200',
  VIEWER: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const classes =
    STATUS_MAP[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${classes} ${className}`}
    >
      {status}
    </span>
  );
}
