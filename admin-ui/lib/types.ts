// admin-ui/lib/types.ts
// Hand-written entity + enum types from Backend Schema §2–3.
// admin-ui does not depend on @prisma/client.

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'SEEKER' | 'EMPLOYER' | 'ADMIN';

export type AccountStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING_DELETION'
  | 'SUSPENDED'
  | 'DELETED';

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type JobStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'EXPIRED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'DENIED';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  isEmailVerified: boolean;
  status: AccountStatus;
  lastLogin?: string;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
  employer?: Employer;
}

export interface Employer {
  id: string;
  userId: string;
  companyName?: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  companyType?: string;
  location?: string;
}

export interface VerificationStatusHistoryEntry {
  status: VerificationStatus;
  timestamp: string;
  by?: string;
  reason?: string;
}

export interface EmployerVerification {
  id: string;
  employerId: string;
  companyName: string;
  companyWebsite?: string;
  companyType?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  documentUrl: string;
  documentKey?: string;
  documentFileName?: string;
  status: VerificationStatus;
  submissionCount: number;
  isLatest: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  previousVerificationId?: string;
  statusHistory: VerificationStatusHistoryEntry[];
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  employer?: Employer;
}

export interface Job {
  id: string;
  employerId: string;
  jobTitle?: string;
  slug: string;
  jobType?: string;
  workMode?: string;
  experienceLevel?: string;
  location?: string;
  description?: string;
  applicationType?: string;
  externalUrl?: string;
  screeningQuestions?: unknown;
  status: JobStatus;
  rejectionReason?: string;
  viewCount: number;
  applicationCount: number;
  expiresAt?: string;
  publishedAt?: string;
  createdAt: string;
  employer?: Employer;
}

// Prices arrive as strings from Prisma Decimal serialization
export interface SubscriptionPackage {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  maxActiveJobs: number;
  maxTeamMembers: number;
  featuredJobSlots: number;
  aiScoringEnabled: boolean;
  priceMonthly?: string;
  priceYearly?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerSubscription {
  id: string;
  employerId: string;
  packageId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt?: string;
  currentActiveJobs: number;
  currentTeamMembers: number;
  usedFeaturedJobSlots: number;
  createdAt: string;
  updatedAt: string;
  package?: SubscriptionPackage;
  employer?: Employer;
}

// Tab 3: Admin Activity Logs — console mutations (AdminAuditLog)
export interface AdminActivityLog {
  id: string;
  adminId: string;
  action: string;
  module: string;
  resource?: string;
  resourceId?: string;
  oldData?: unknown;
  newData?: unknown;
  riskLevel: RiskLevel;
  result: AuditResult;
  reason?: string;
  ipAddress?: string;
  metadata?: unknown;
  createdAt: string;
  admin?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Tab 2: System Logs — main app business actions (AuditLog)
export interface SystemAuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  oldData?: unknown;
  newData?: unknown;
  riskLevel: RiskLevel;
  result: AuditResult;
  reason?: string;
  ipAddress?: string;
  metadata?: unknown;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Tab 1: Audit Logs — unified auth trail, merged from AuthAuditLog (main app)
// + AdminAuthAuditLog (admin console) via a single sorted/paginated query.
export interface UnifiedAuthLog {
  id: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  source: 'MAIN_APP' | 'ADMIN_CONSOLE';
  actorId?: string;
  actorEmail?: string;
  actorFirstName?: string;
  actorLastName?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: unknown;
  createdAt: string;
}

export interface RbacRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: RolePermissionEntry[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
  isActive: boolean;
}

export interface RolePermissionEntry {
  permission: Permission;
}

export interface AdminRoleAssignment {
  id: string;
  adminId: string;
  roleId: string;
  expiresAt?: string;
  assignedBy?: string;
  createdAt: string;
  role?: RbacRole;
}

export interface AdminPermissionOverride {
  id: string;
  adminId: string;
  permissionId: string;
  grant: boolean;
  reason?: string;
  grantedBy?: string;
  createdAt: string;
  permission?: Permission;
}

export interface AdminAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: string;
  roleAssignments: { id: string; role: { id: string; name: string } }[];
}

export interface Testimonial {
  id: string;
  type: 'SEEKER' | 'EMPLOYER';
  name: string;
  role: string;
  company: string;
  avatar?: string;
  avatarColor?: string;
  quote: string;
  stars: number;
  tag?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface AdminMe {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  roles: string[];
  isSuperAdmin: boolean;
  permissions: string[];
}

export interface DashboardStats {
  users: {
    total: number;
    seekers: number;
    employers: number;
  };
  jobs: {
    active: number;
    pendingApproval: number;
  };
  kyc: {
    pendingReview: number;
  };
  applications: {
    total: number;
  };
  subscriptions: {
    active: number;
  };
}
