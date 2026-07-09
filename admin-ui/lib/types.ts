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

export interface AuditLog {
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
