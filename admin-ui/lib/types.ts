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

export type ApplicationStatus = 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'WITHDRAWN';

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
  isFlagged: boolean;
  flaggedReason?: string;
  flaggedAt?: string;
  flaggedBy?: string;
  createdAt: string;
  updatedAt: string;
  employer?: Employer;
  jobSeekerProfile?: JobSeekerProfile;
  applications?: ApplicationSummary[];
}

export interface Employer {
  id: string;
  userId?: string;
  companyName?: string;
  companyType?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  slug?: string;
  companyWebsite?: string;
  contactEmail?: string;
  foundedYear?: number;
  tagline?: string;
  cultureDescription?: string;
  companyLogo?: string;
  companyBanner?: string;
  about?: string;
  mission?: string;
  vision?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  profileCompletion?: number;
  isVerified?: boolean;
  verifiedAt?: string;
  isActive?: boolean;
  isFlagged?: boolean;
  createdAt?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  tools: string[];
  achievements: string[];
}

export interface Education {
  id: string;
  degree: string;
  fieldOfStudy?: string;
  instituteName?: string;
  institute?: { name: string } | null;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export interface JobSeekerSkillEntry {
  id: string;
  proficiency: string;
  yearsOfExperience?: number;
  skill: { name: string; category?: { name: string } };
}

export interface JobSeekerCertificationEntry {
  id: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certification: { name: string };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  projectUrl?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  highlights: string[];
}

export interface CTFProfileEntry {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  rank?: string;
  points?: number;
}

export interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: { id: string; email: string };
  };
}

export interface ApplicationSummary {
  id: string;
  status: ApplicationStatus;
  aiScore?: number;
  appliedAt: string;
  job?: { id: string; jobTitle?: string; employer?: { id?: string; companyName?: string } };
  jobSeeker?: { id: string; firstName: string; lastName: string; email: string };
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  oldStatus: ApplicationStatus;
  newStatus: ApplicationStatus;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export interface ApplicationNote {
  id: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  screeningAnswers?: unknown;
  aiScoreData?: unknown;
  aiScoredAt?: string;
  resume?: { id: string; fileName: string } | null;
  statusHistory: ApplicationStatusHistoryEntry[];
  notes: ApplicationNote[];
}

export interface JobSeekerProfile {
  id: string;
  title?: string;
  professionalSummary?: string;
  location?: { displayName: string } | null;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  professionalEmail?: string;
  availability: string;
  profileCompletion: number;
  experiences: Experience[];
  education: Education[];
  skills: JobSeekerSkillEntry[];
  certifications: JobSeekerCertificationEntry[];
  projects: Project[];
  ctfProfiles: CTFProfileEntry[];
  resumes: Resume[];
}

export interface VerificationStatusHistoryEntry {
  status: VerificationStatus;
  timestamp: string;
  by?: string;
  /** Resolved display name for `by` — attached at read time by admin-app. */
  byName?: string;
  reason?: string;
  notes?: string;
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

export interface Location {
  id: string;
  city: string;
  state: string;
  country: string;
  displayName: string;
  searchText: string;
  isPopular: boolean;
  usageCount: number;
  createdAt: string;
}

export interface Job {
  id: string;
  employerId: string;
  jobTitle?: string;
  slug: string;
  jobType?: string;
  workMode?: string;
  experienceLevel?: string;
  location?: Location | null;
  description?: string;
  applicationType?: string;
  externalUrl?: string;
  screeningQuestions?: unknown;
  status: JobStatus;
  rejectionReason?: string;
  viewCount: number;
  applicationCount: number;
  isFeatured: boolean;
  expiresAt?: string;
  publishedAt?: string;
  isFeatured?: boolean;
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
  jobPostingPeriodDays: number;
  resumeViewEnabled: boolean;
  canExportApplicants: boolean;
  analyticsEnabled: boolean;
  prioritySupportEnabled: boolean;
  priceMonthly?: string;
  priceYearly?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillingCycle = 'MONTHLY' | 'YEARLY';
export type PaymentOrderStatus = 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED';
export type PaymentStatus = 'CAPTURED' | 'FAILED' | 'REFUNDED';

export type DiscountTrigger = 'COUPON_CODE' | 'AUTOMATIC';
export type DiscountType = 'PERCENTAGE' | 'FLAT';
export type DiscountStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
export type DiscountApplicability = 'ALL_PACKAGES' | 'SPECIFIC_PACKAGES';

// value arrives as a string (Prisma Decimal serialization, same as SubscriptionPackage prices)
export interface Discount {
  id: string;
  name: string;
  code?: string | null;
  trigger: DiscountTrigger;
  discountType: DiscountType;
  value: string;
  maxDiscountCap?: number | null;
  minOrderAmountPaise?: number | null;
  applicability: DiscountApplicability;
  billingCycles: BillingCycle[];
  maxTotalUses?: number | null;
  maxUsesPerUser: number;
  startsAt: string;
  expiresAt?: string | null;
  status: DiscountStatus;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { usages: number };
  // detail-only
  conditions?: Record<string, unknown> | null;
  createdBy?: string;
  updatedBy?: string | null;
  packages?: { packageId: string; package: { id: string; name: string } }[];
}

export interface DiscountUsage {
  id: string;
  employerId: string;
  orderId: string;
  amountSavedPaise: number;
  createdAt: string;
  employer?: {
    id: string;
    companyName: string;
    user?: { email: string; firstName: string; lastName: string };
  };
}

export interface EmployerSubscription {
  id: string;
  employerId: string;
  packageId: string;
  status: SubscriptionStatus;
  /** Server-computed display status — ACTIVE+flag → CANCELLED, ACTIVE+past-expiry → EXPIRED */
  effectiveStatus?: SubscriptionStatus;
  /** Cancel-at-period-end: still entitled until expiresAt, then drops to Free. */
  cancelAtPeriodEnd?: boolean;
  cancelRequestedAt?: string;
  billingCycle?: BillingCycle;
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

export interface PaymentOrder {
  id: string;
  employerId: string;
  packageId: string;
  razorpayOrderId: string;
  billingCycle: BillingCycle;
  amountPaise: number;
  gstAmountPaise: number;
  totalAmountPaise: number;
  currency: string;
  status: PaymentOrderStatus;
  expiresAt: string;
  createdAt: string;
  employer?: { id: string; companyName?: string; slug?: string };
  package?: { id: string; name: string };
  payment?: { razorpayPaymentId: string; capturedAt?: string; status: PaymentStatus } | null;
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

export interface AdminSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
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

export type AdminInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface AdminInvite {
  id: string;
  email: string;
  status: AdminInviteStatus;
  expiresAt: string;
  createdAt: string;
  role: { id: string; name: string } | null;
  inviter: { id: string; firstName: string; lastName: string } | null;
}

export type ContactFormStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'SPAM';

export interface ContactForm {
  id: string;
  fullName: string;
  email: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
  status: ContactFormStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedBy?: string;
  updatedAt: string;
  createdAt: string;
}

export interface PolicyConfig {
  id: string;
  key: string;
  value: string;
  type: 'integer' | 'boolean' | 'string';
  description?: string;
  unit?: string;
  updatedBy?: string;
  updatedAt: string;
  createdAt: string;
}

export type SuggestionType = 'ROLE' | 'SKILL' | 'COMPANY';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type BlacklistType = 'EMAIL' | 'DOMAIN';

export interface BlacklistEntry {
  id: string;
  value: string;
  type: BlacklistType;
  reason?: string;
  addedBy: string;
  createdAt: string;
}

export type AnnouncementTarget = 'ALL' | 'SEEKER' | 'EMPLOYER';

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  target: AnnouncementTarget;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type FlaggedContentType = 'JOB' | 'EMPLOYER_PROFILE' | 'SEEKER_PROFILE' | 'MESSAGE';

export type FlagReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'MISLEADING'
  | 'FAKE_COMPANY'
  | 'HARASSMENT'
  | 'OTHER';

export type FlagStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED_REMOVED' | 'RESOLVED_DISMISSED';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  contentType: FlaggedContentType;
  contentId: string;
  reason: FlagReason;
  description?: string;
  status: FlagStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
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
  sessionExpiresAt?: string;
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

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface RevenueAnalytics {
  period: AnalyticsPeriod;
  mrr: number;
  totalRevenuePaise: number;
  byPlan: { package: string; revenuePaise: number }[];
  daily: { date: string; revenuePaise: number }[];
}

export interface SubscriptionAnalytics {
  period: AnalyticsPeriod;
  newCount: number;
  churnedCount: number;
  netChange: number;
  byPlan: { package: string; count: number }[];
}

export interface UserAnalytics {
  period: AnalyticsPeriod;
  daily: { date: string; seekers: number; employers: number }[];
}

export interface JobAnalytics {
  period: AnalyticsPeriod;
  daily: { date: string; pending: number; approved: number; rejected: number; expired: number }[];
}

export interface ApplicationAnalytics {
  period: AnalyticsPeriod;
  totalCount: number;
  conversionRate: number;
}

export type ServiceStatus = 'up' | 'down' | 'degraded';

export interface ServiceHealth {
  name: string;
  url?: string;
  status: ServiceStatus;
  latencyMs: number | null;
}

export interface SystemHealth {
  services: ServiceHealth[];
  redis: { status: 'up' | 'down' };
  db: { status: 'up' | 'down' };
}

export interface JobDomain {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  domainId: string | null;
  domain: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Emails & Broadcasts ───────────────────────────────────────────────────────

export type EmailRecipientType = 'SEGMENT' | 'CUSTOM_LIST';

export type EmailCampaignStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIALLY_FAILED';

export interface AdminEmailRecipientLog {
  id: string;
  campaignId: string;
  email: string;
  name?: string | null;
  status: 'SENT' | 'FAILED';
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface AdminEmailCampaign {
  id: string;
  subject: string;
  bodyHtml: string;
  recipientType: EmailRecipientType;
  segmentTarget?: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: EmailCampaignStatus;
  errorMessage?: string | null;
  createdById: string;
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  recipientLogs?: AdminEmailRecipientLog[];
  _count?: {
    recipientLogs: number;
  };
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Resend Transactional Email Logs & Suppressions ───────────────────────────

export interface ResendEmailLogItem {
  id: string;
  object?: string;
  to: string[] | string;
  from: string;
  created_at: string;
  subject: string;
  html?: string;
  text?: string;
  bcc?: string[];
  cc?: string[];
  reply_to?: string[];
  last_event?: 'delivered' | 'sent' | 'bounced' | 'suppressed' | 'complained' | 'delivery_delayed' | string;
  status?: string;
}

export interface ResendEmailDetail extends ResendEmailLogItem {
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export interface ResendSuppressionItem {
  id: string;
  email: string;
  reason: string;
  subject?: string;
  created_at: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  category?: string | null;
  coverImage?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogsResponse {
  items: Blog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics?: {
    total: number;
    published: number;
    drafts: number;
    categories: number;
  };
}
