CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SEEKER', 'EMPLOYER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'PENDING_DELETION', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMPLOYER_INVITE', 'OTP_LOGIN', 'CANCEL_DELETION');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('WEB', 'MOBILE', 'TABLET', 'DESKTOP', 'API');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('COOKIE', 'JWT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_STATUS', 'APPLICATION_WITHDRAWN', 'JOB_REJECTION', 'INTERVIEW_SCHEDULED', 'INTERVIEW_UPDATED', 'JOB_ALERT', 'BOOKMARK_ALERT', 'NEW_APPLICANT', 'APPLICATION_UPDATE', 'GROUPED_APPLICANTS', 'JOB_EXPIRY_ALERT', 'JOB_APPROVAL', 'KYC_APPROVED', 'KYC_REJECTED', 'PLATFORM_ANNOUNCEMENT', 'SYSTEM_ANNOUNCEMENT', 'PROFILE_REMINDER', 'FEEDBACK_RECEIVED', 'CERTIFICATION_ALERT', 'BUG_BOUNTY_ALERT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY', 'DISABLED');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('WEBSOCKET', 'EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('COOPERATIVE_SOCIETY', 'SOLE_PROPRIETORSHIP', 'FAMILY_OWNED_BUSINESS', 'PRIVATE_LIMITED_COMPANY', 'PUBLIC_LIMITED_COMPANY', 'EDUCATIONAL_INSTITUTION', 'POLITICAL_PARTY', 'NGO', 'NATIONALISED_BANK', 'PRIVATE_BANK', 'LIFE_INSURANCE_COMPANY', 'GENERAL_INSURANCE_COMPANY', 'PARTNERSHIP_FIRM', 'TRUST_CLUB_ASSOCIATION', 'SEBI_APPROVED_BROKER', 'OTHERS');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'EDUCATION', 'RETAIL', 'MANUFACTURING', 'CONSULTING', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SIZE_1_10', 'SIZE_11_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_501_1000', 'SIZE_1000_PLUS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('ENTRY', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('DIRECT', 'EXTERNAL', 'SCREENING');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SHORT_ANSWER', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "JobSearchStatus" AS ENUM ('ACTIVELY_LOOKING', 'OPEN_TO_OFFERS', 'NOT_LOOKING');

-- CreateEnum
CREATE TYPE "EmployerProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'JOB_INQUIRY');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'GITHUB', 'LINKEDIN', 'MICROSOFT');

-- CreateEnum
CREATE TYPE "EmployerMemberRole" AS ENUM ('OWNER', 'HIRING_MANAGER', 'RECRUITER', 'VIEWER');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "DiscountTrigger" AS ENUM ('COUPON_CODE', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "DiscountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountApplicability" AS ENUM ('ALL_PACKAGES', 'SPECIFIC_PACKAGES');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('CREATED', 'PAID', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AdminInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "FlaggedContentType" AS ENUM ('JOB', 'EMPLOYER_PROFILE', 'SEEKER_PROFILE', 'MESSAGE');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('SPAM', 'INAPPROPRIATE', 'MISLEADING', 'FAKE_COMPANY', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FlagStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED_REMOVED', 'RESOLVED_DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "profileImage" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "deactivatedAt" TIMESTAMP(3),
    "deletionScheduledAt" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastFailedLoginAt" TIMESTAMP(3),
    "lastFailedLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "lastRotatedAt" TIMESTAMP(3),
    "deviceFingerprint" TEXT,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'WEB',
    "sessionType" "SessionType" NOT NULL DEFAULT 'COOKIE',
    "deviceName" TEXT,
    "deviceModel" TEXT,
    "platform" TEXT,
    "appVersion" TEXT,
    "pushToken" TEXT,
    "refreshTokenHash" TEXT,
    "accessTokenJti" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "userId" TEXT NOT NULL,
    "employerId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "metadata" JSONB,
    "deliveredVia" "DeliveryChannel"[],
    "emailSentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableInApp" BOOLEAN NOT NULL DEFAULT true,
    "enableEmail" BOOLEAN NOT NULL DEFAULT true,
    "applicationSubmitted_inApp" BOOLEAN NOT NULL DEFAULT true,
    "applicationSubmitted_email" BOOLEAN NOT NULL DEFAULT true,
    "applicationStatus_inApp" BOOLEAN NOT NULL DEFAULT true,
    "applicationStatus_email" BOOLEAN NOT NULL DEFAULT true,
    "jobRejection_inApp" BOOLEAN NOT NULL DEFAULT true,
    "jobRejection_email" BOOLEAN NOT NULL DEFAULT false,
    "interviewScheduled_inApp" BOOLEAN NOT NULL DEFAULT true,
    "interviewScheduled_email" BOOLEAN NOT NULL DEFAULT true,
    "jobAlert_inApp" BOOLEAN NOT NULL DEFAULT true,
    "jobAlert_email" BOOLEAN NOT NULL DEFAULT true,
    "jobAlert_frequency" "EmailFrequency" NOT NULL DEFAULT 'INSTANT',
    "newApplicant_inApp" BOOLEAN NOT NULL DEFAULT true,
    "newApplicant_email" BOOLEAN NOT NULL DEFAULT true,
    "applicationUpdate_inApp" BOOLEAN NOT NULL DEFAULT true,
    "applicationUpdate_email" BOOLEAN NOT NULL DEFAULT false,
    "groupedApplicants_inApp" BOOLEAN NOT NULL DEFAULT true,
    "groupedApplicants_email" BOOLEAN NOT NULL DEFAULT true,
    "groupedApplicants_frequency" "EmailFrequency" NOT NULL DEFAULT 'DAILY',
    "jobExpiryAlert_inApp" BOOLEAN NOT NULL DEFAULT true,
    "jobExpiryAlert_email" BOOLEAN NOT NULL DEFAULT true,
    "jobApproval_inApp" BOOLEAN NOT NULL DEFAULT true,
    "jobApproval_email" BOOLEAN NOT NULL DEFAULT true,
    "kycApproved_inApp" BOOLEAN NOT NULL DEFAULT true,
    "kycApproved_email" BOOLEAN NOT NULL DEFAULT true,
    "kycRejected_inApp" BOOLEAN NOT NULL DEFAULT true,
    "kycRejected_email" BOOLEAN NOT NULL DEFAULT true,
    "platformAnnouncement_inApp" BOOLEAN NOT NULL DEFAULT true,
    "platformAnnouncement_email" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'JOB_INQUIRY',
    "jobId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" VARCHAR(200),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "contentHash" TEXT,
    "iv" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileMimeType" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readAt" TIMESTAMP(3),
    "deliveredTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveredAt" TIMESTAMP(3),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "professionalSummary" TEXT,
    "locationId" TEXT,
    "linkedin" TEXT,
    "github" TEXT,
    "portfolio" TEXT,
    "professionalEmail" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'Open to offers',
    "profileCompletion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_seeker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employmentType" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "tools" TEXT[],
    "achievements" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "instituteId" TEXT,
    "instituteName" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "grade" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technologies" TEXT[],
    "projectUrl" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "highlights" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ctf_profiles" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "rank" TEXT,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ctf_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_skills" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "yearsOfExperience" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_seeker_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "description" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_certifications" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "expiryDate" TEXT,
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "certificateFile" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_seeker_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL,
    "industry" "Industry" NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "location" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "contactEmail" TEXT,
    "foundedYear" INTEGER,
    "tagline" TEXT,
    "cultureDescription" TEXT,
    "companyLogo" TEXT,
    "companyBanner" TEXT,
    "about" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "profileCompletion" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_verifications" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyWebsite" TEXT NOT NULL,
    "companyType" "CompanyType" NOT NULL,
    "industry" "Industry" NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "location" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "documentFileName" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submissionCount" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "previousVerificationId" TEXT,
    "statusHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_locations" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_benefits" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profileImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_media" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "slug" TEXT NOT NULL,
    "roleId" TEXT,
    "jobType" "JobType" NOT NULL,
    "contractDuration" INTEGER,
    "workMode" "WorkMode" NOT NULL,
    "locationId" TEXT,
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "description" TEXT,
    "requirements" JSONB,
    "responsibilities" JSONB,
    "niceToHave" JSONB,
    "applicationType" "ApplicationType" NOT NULL,
    "externalUrl" TEXT,
    "screeningQuestions" JSONB,
    "status" "JobStatus" NOT NULL,
    "rejectionReason" TEXT,
    "closedReason" VARCHAR(200),
    "closedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embedding" vector(1536),
    "embeddedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_certifications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_views" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "screeningAnswers" JSONB,
    "resumeId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "aiScore" INTEGER,
    "aiScoreData" JSONB,
    "aiScoredAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "oldStatus" "ApplicationStatus" NOT NULL,
    "newStatus" "ApplicationStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "note" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "viewerType" TEXT NOT NULL,
    "viewerId" TEXT,
    "jobId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profile_views" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "company_profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactForm" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "avatar" TEXT,
    "avatarColor" TEXT,
    "quote" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 5,
    "tag" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "category" TEXT,
    "coverImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "bannerImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "jobSearchStatus" "JobSearchStatus" NOT NULL DEFAULT 'ACTIVELY_LOOKING',
    "availableFrom" TIMESTAMP(3),
    "preferredJobTypes" "JobType"[] DEFAULT ARRAY[]::"JobType"[],
    "preferredWorkModes" "WorkMode"[] DEFAULT ARRAY[]::"WorkMode"[],
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_seeker_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_settings" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "profileVisibility" "EmployerProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "showCompanyDetailsBeforeApply" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT '',
    "resource" TEXT,
    "resourceId" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_auth_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "adminId" UUID,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_oauth_providers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_oauth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_members" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EmployerMemberRole" NOT NULL DEFAULT 'RECRUITER',
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxActiveJobs" INTEGER NOT NULL DEFAULT 5,
    "maxTeamMembers" INTEGER NOT NULL DEFAULT 3,
    "featuredJobSlots" INTEGER NOT NULL DEFAULT 0,
    "aiScoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "jobPostingPeriodDays" INTEGER NOT NULL DEFAULT 45,
    "resumeViewEnabled" BOOLEAN NOT NULL DEFAULT false,
    "canExportApplicants" BOOLEAN NOT NULL DEFAULT false,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "priceMonthly" DECIMAL(10,2),
    "priceYearly" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_subscriptions" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingCycle" "BillingCycle",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "currentActiveJobs" INTEGER NOT NULL DEFAULT 0,
    "currentTeamMembers" INTEGER NOT NULL DEFAULT 0,
    "usedFeaturedJobSlots" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "packageId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "discountAmountPaise" INTEGER NOT NULL DEFAULT 0,
    "gstAmountPaise" INTEGER NOT NULL,
    "totalAmountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'CREATED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "discountId" UUID,
    "couponCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "razorpaySignature" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CAPTURED',
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "trigger" "DiscountTrigger" NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "maxDiscountCap" INTEGER,
    "minOrderAmountPaise" INTEGER,
    "applicability" "DiscountApplicability" NOT NULL DEFAULT 'ALL_PACKAGES',
    "billingCycles" "BillingCycle"[],
    "maxTotalUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" "DiscountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "conditions" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_packages" (
    "id" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "discount_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_usages" (
    "id" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "employerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountSavedPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_embeddings" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "embeddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seeker_job_matches" (
    "id" TEXT NOT NULL,
    "seekerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seeker_job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL DEFAULT 'ADMIN',
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rbac_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "employerId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_overrides" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "employerId" TEXT,
    "grant" BOOLEAN NOT NULL,
    "grantedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_rbac_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_rbac_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_assignments" (
    "id" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "roleId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permission_overrides" (
    "id" TEXT NOT NULL,
    "adminId" UUID NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grant" BOOLEAN NOT NULL,
    "grantedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invites" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" UUID NOT NULL,
    "roleId" TEXT,
    "status" "AdminInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "contentType" "FlaggedContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL,
    "description" TEXT,
    "status" "FlagStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_lockedUntil_idx" ON "users"("lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_userId_isActive_idx" ON "sessions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sessions_userId_deviceType_idx" ON "sessions"("userId", "deviceType");

-- CreateIndex
CREATE INDEX "sessions_refreshTokenHash_idx" ON "sessions"("refreshTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_userId_type_idx" ON "tokens"("userId", "type");

-- CreateIndex
CREATE INDEX "tokens_employerId_type_idx" ON "tokens"("employerId", "type");

-- CreateIndex
CREATE INDEX "tokens_token_idx" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_expiresAt_idx" ON "tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "tokens_type_expiresAt_usedAt_idx" ON "tokens"("type", "expiresAt", "usedAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_type_idx" ON "notifications"("userId", "type");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_relatedEntityType_relatedEntityId_idx" ON "notifications"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_queue_status_idx" ON "notification_queue"("status");

-- CreateIndex
CREATE INDEX "notification_queue_userId_idx" ON "notification_queue"("userId");

-- CreateIndex
CREATE INDEX "notification_queue_scheduledFor_idx" ON "notification_queue"("scheduledFor");

-- CreateIndex
CREATE INDEX "conversations_jobId_idx" ON "conversations"("jobId");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversations_createdAt_idx" ON "conversations"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "conversation_participants"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_unreadCount_idx" ON "conversation_participants"("userId", "unreadCount");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");

-- CreateIndex
CREATE INDEX "messages_replyToId_idx" ON "messages"("replyToId");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_profiles_userId_key" ON "job_seeker_profiles"("userId");

-- CreateIndex
CREATE INDEX "job_seeker_profiles_userId_idx" ON "job_seeker_profiles"("userId");

-- CreateIndex
CREATE INDEX "job_seeker_profiles_locationId_idx" ON "job_seeker_profiles"("locationId");

-- CreateIndex
CREATE INDEX "experiences_profileId_idx" ON "experiences"("profileId");

-- CreateIndex
CREATE INDEX "experiences_current_idx" ON "experiences"("current");

-- CreateIndex
CREATE INDEX "education_profileId_idx" ON "education"("profileId");

-- CreateIndex
CREATE INDEX "education_instituteId_idx" ON "education"("instituteId");

-- CreateIndex
CREATE INDEX "projects_profileId_idx" ON "projects"("profileId");

-- CreateIndex
CREATE INDEX "ctf_profiles_profileId_idx" ON "ctf_profiles"("profileId");

-- CreateIndex
CREATE INDEX "resumes_profileId_idx" ON "resumes"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "job_seeker_skills_profileId_idx" ON "job_seeker_skills"("profileId");

-- CreateIndex
CREATE INDEX "job_seeker_skills_skillId_idx" ON "job_seeker_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_skills_profileId_skillId_key" ON "job_seeker_skills"("profileId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_name_key" ON "certifications"("name");

-- CreateIndex
CREATE INDEX "certifications_name_idx" ON "certifications"("name");

-- CreateIndex
CREATE INDEX "certifications_organization_idx" ON "certifications"("organization");

-- CreateIndex
CREATE INDEX "job_seeker_certifications_profileId_idx" ON "job_seeker_certifications"("profileId");

-- CreateIndex
CREATE INDEX "job_seeker_certifications_certificationId_idx" ON "job_seeker_certifications"("certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_certifications_profileId_certificationId_key" ON "job_seeker_certifications"("profileId", "certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "institutes_name_key" ON "institutes"("name");

-- CreateIndex
CREATE INDEX "institutes_name_idx" ON "institutes"("name");

-- CreateIndex
CREATE INDEX "institutes_country_idx" ON "institutes"("country");

-- CreateIndex
CREATE INDEX "locations_searchText_idx" ON "locations"("searchText");

-- CreateIndex
CREATE INDEX "locations_isPopular_usageCount_idx" ON "locations"("isPopular", "usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "locations_city_state_country_key" ON "locations"("city", "state", "country");

-- CreateIndex
CREATE UNIQUE INDEX "employers_userId_key" ON "employers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employers_slug_key" ON "employers"("slug");

-- CreateIndex
CREATE INDEX "employers_slug_idx" ON "employers"("slug");

-- CreateIndex
CREATE INDEX "employers_isVerified_idx" ON "employers"("isVerified");

-- CreateIndex
CREATE INDEX "employers_companyType_idx" ON "employers"("companyType");

-- CreateIndex
CREATE INDEX "employers_industry_idx" ON "employers"("industry");

-- CreateIndex
CREATE INDEX "employer_verifications_employerId_idx" ON "employer_verifications"("employerId");

-- CreateIndex
CREATE INDEX "employer_verifications_status_idx" ON "employer_verifications"("status");

-- CreateIndex
CREATE INDEX "employer_verifications_isLatest_idx" ON "employer_verifications"("isLatest");

-- CreateIndex
CREATE INDEX "employer_verifications_reviewedBy_idx" ON "employer_verifications"("reviewedBy");

-- CreateIndex
CREATE INDEX "employer_verifications_submittedAt_idx" ON "employer_verifications"("submittedAt");

-- CreateIndex
CREATE INDEX "office_locations_employerId_idx" ON "office_locations"("employerId");

-- CreateIndex
CREATE INDEX "office_locations_employerId_isHeadquarters_idx" ON "office_locations"("employerId", "isHeadquarters");

-- CreateIndex
CREATE INDEX "company_benefits_employerId_idx" ON "company_benefits"("employerId");

-- CreateIndex
CREATE INDEX "team_members_employerId_idx" ON "team_members"("employerId");

-- CreateIndex
CREATE INDEX "team_members_email_idx" ON "team_members"("email");

-- CreateIndex
CREATE INDEX "company_media_employerId_idx" ON "company_media"("employerId");

-- CreateIndex
CREATE INDEX "company_media_employerId_order_idx" ON "company_media"("employerId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_category_idx" ON "roles"("category");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_slug_key" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "jobs_employerId_idx" ON "jobs"("employerId");

-- CreateIndex
CREATE INDEX "jobs_roleId_idx" ON "jobs"("roleId");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_status_expiresAt_idx" ON "jobs"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "jobs_jobType_idx" ON "jobs"("jobType");

-- CreateIndex
CREATE INDEX "jobs_workMode_idx" ON "jobs"("workMode");

-- CreateIndex
CREATE INDEX "jobs_locationId_idx" ON "jobs"("locationId");

-- CreateIndex
CREATE INDEX "jobs_expiresAt_idx" ON "jobs"("expiresAt");

-- CreateIndex
CREATE INDEX "jobs_createdAt_idx" ON "jobs"("createdAt");

-- CreateIndex
CREATE INDEX "jobs_slug_idx" ON "jobs"("slug");

-- CreateIndex
CREATE INDEX "job_skills_jobId_idx" ON "job_skills"("jobId");

-- CreateIndex
CREATE INDEX "job_skills_skillId_idx" ON "job_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_skills_jobId_skillId_key" ON "job_skills"("jobId", "skillId");

-- CreateIndex
CREATE INDEX "job_certifications_jobId_idx" ON "job_certifications"("jobId");

-- CreateIndex
CREATE INDEX "job_certifications_certificationId_idx" ON "job_certifications"("certificationId");

-- CreateIndex
CREATE UNIQUE INDEX "job_certifications_jobId_certificationId_key" ON "job_certifications"("jobId", "certificationId");

-- CreateIndex
CREATE INDEX "job_views_jobId_idx" ON "job_views"("jobId");

-- CreateIndex
CREATE INDEX "job_views_viewerId_idx" ON "job_views"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "job_views_jobId_viewerId_key" ON "job_views"("jobId", "viewerId");

-- CreateIndex
CREATE INDEX "applications_seekerId_idx" ON "applications"("seekerId");

-- CreateIndex
CREATE INDEX "applications_jobId_idx" ON "applications"("jobId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_jobId_seekerId_key" ON "applications"("jobId", "seekerId");

-- CreateIndex
CREATE INDEX "application_status_history_applicationId_idx" ON "application_status_history"("applicationId");

-- CreateIndex
CREATE INDEX "application_notes_applicationId_idx" ON "application_notes"("applicationId");

-- CreateIndex
CREATE INDEX "saved_jobs_seekerId_idx" ON "saved_jobs"("seekerId");

-- CreateIndex
CREATE INDEX "saved_jobs_jobId_idx" ON "saved_jobs"("jobId");

-- CreateIndex
CREATE INDEX "saved_jobs_savedAt_idx" ON "saved_jobs"("savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_seekerId_jobId_key" ON "saved_jobs"("seekerId", "jobId");

-- CreateIndex
CREATE INDEX "profile_views_profileId_idx" ON "profile_views"("profileId");

-- CreateIndex
CREATE INDEX "profile_views_viewerId_idx" ON "profile_views"("viewerId");

-- CreateIndex
CREATE INDEX "profile_views_jobId_idx" ON "profile_views"("jobId");

-- CreateIndex
CREATE INDEX "profile_views_viewedAt_idx" ON "profile_views"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "profile_views_profileId_viewerId_key" ON "profile_views"("profileId", "viewerId");

-- CreateIndex
CREATE INDEX "company_profile_views_employerId_idx" ON "company_profile_views"("employerId");

-- CreateIndex
CREATE INDEX "company_profile_views_viewerId_idx" ON "company_profile_views"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "company_profile_views_employerId_viewerId_key" ON "company_profile_views"("employerId", "viewerId");

-- CreateIndex
CREATE INDEX "ContactForm_status_idx" ON "ContactForm"("status");

-- CreateIndex
CREATE INDEX "ContactForm_createdAt_idx" ON "ContactForm"("createdAt");

-- CreateIndex
CREATE INDEX "ContactForm_email_idx" ON "ContactForm"("email");

-- CreateIndex
CREATE INDEX "testimonials_type_isPublished_idx" ON "testimonials"("type", "isPublished");

-- CreateIndex
CREATE INDEX "testimonials_sortOrder_idx" ON "testimonials"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_settings_userId_key" ON "job_seeker_settings"("userId");

-- CreateIndex
CREATE INDEX "job_seeker_settings_userId_idx" ON "job_seeker_settings"("userId");

-- CreateIndex
CREATE INDEX "job_seeker_settings_profileVisibility_idx" ON "job_seeker_settings"("profileVisibility");

-- CreateIndex
CREATE INDEX "job_seeker_settings_jobSearchStatus_idx" ON "job_seeker_settings"("jobSearchStatus");

-- CreateIndex
CREATE INDEX "job_seeker_settings_jobSearchStatus_profileVisibility_idx" ON "job_seeker_settings"("jobSearchStatus", "profileVisibility");

-- CreateIndex
CREATE INDEX "location_preferences_userId_idx" ON "location_preferences"("userId");

-- CreateIndex
CREATE INDEX "location_preferences_locationId_idx" ON "location_preferences"("locationId");

-- CreateIndex
CREATE INDEX "location_preferences_userId_priority_idx" ON "location_preferences"("userId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "location_preferences_userId_locationId_key" ON "location_preferences"("userId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_settings_employerId_key" ON "employer_settings"("employerId");

-- CreateIndex
CREATE INDEX "employer_settings_employerId_idx" ON "employer_settings"("employerId");

-- CreateIndex
CREATE INDEX "employer_settings_profileVisibility_idx" ON "employer_settings"("profileVisibility");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_email_idx" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_token_idx" ON "admin_sessions"("token");

-- CreateIndex
CREATE INDEX "admin_sessions_adminId_idx" ON "admin_sessions"("adminId");

-- CreateIndex
CREATE INDEX "admin_sessions_expiresAt_idx" ON "admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_module_idx" ON "admin_audit_logs"("module");

-- CreateIndex
CREATE INDEX "admin_audit_logs_riskLevel_idx" ON "admin_audit_logs"("riskLevel");

-- CreateIndex
CREATE INDEX "admin_audit_logs_result_idx" ON "admin_audit_logs"("result");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_resource_resourceId_idx" ON "admin_audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "auth_audit_logs_userId_idx" ON "auth_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "auth_audit_logs_action_idx" ON "auth_audit_logs"("action");

-- CreateIndex
CREATE INDEX "auth_audit_logs_createdAt_idx" ON "auth_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "auth_audit_logs_status_idx" ON "auth_audit_logs"("status");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_adminId_idx" ON "admin_auth_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_action_idx" ON "admin_auth_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_createdAt_idx" ON "admin_auth_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_auth_audit_logs_status_idx" ON "admin_auth_audit_logs"("status");

-- CreateIndex
CREATE INDEX "user_oauth_providers_userId_idx" ON "user_oauth_providers"("userId");

-- CreateIndex
CREATE INDEX "user_oauth_providers_provider_providerId_idx" ON "user_oauth_providers"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_providers_userId_provider_key" ON "user_oauth_providers"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_providers_provider_providerId_key" ON "user_oauth_providers"("provider", "providerId");

-- CreateIndex
CREATE INDEX "employer_members_employerId_idx" ON "employer_members"("employerId");

-- CreateIndex
CREATE INDEX "employer_members_userId_idx" ON "employer_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employer_members_employerId_userId_key" ON "employer_members"("employerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_packages_name_key" ON "subscription_packages"("name");

-- CreateIndex
CREATE INDEX "subscription_packages_isActive_idx" ON "subscription_packages"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "employer_subscriptions_employerId_key" ON "employer_subscriptions"("employerId");

-- CreateIndex
CREATE INDEX "employer_subscriptions_employerId_idx" ON "employer_subscriptions"("employerId");

-- CreateIndex
CREATE INDEX "employer_subscriptions_status_idx" ON "employer_subscriptions"("status");

-- CreateIndex
CREATE INDEX "employer_subscriptions_expiresAt_idx" ON "employer_subscriptions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_razorpayOrderId_key" ON "payment_orders"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_orders_employerId_idx" ON "payment_orders"("employerId");

-- CreateIndex
CREATE INDEX "payment_orders_status_idx" ON "payment_orders"("status");

-- CreateIndex
CREATE INDEX "payment_orders_razorpayOrderId_idx" ON "payment_orders"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payment_orders_expiresAt_idx" ON "payment_orders"("expiresAt");

-- CreateIndex
CREATE INDEX "payment_orders_discountId_idx" ON "payment_orders"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayPaymentId_key" ON "payments"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payments_razorpayPaymentId_idx" ON "payments"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "discounts_code_idx" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "discounts_status_idx" ON "discounts"("status");

-- CreateIndex
CREATE INDEX "discounts_trigger_idx" ON "discounts"("trigger");

-- CreateIndex
CREATE INDEX "discounts_startsAt_expiresAt_idx" ON "discounts"("startsAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_packages_discountId_packageId_key" ON "discount_packages"("discountId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "discount_usages_orderId_key" ON "discount_usages"("orderId");

-- CreateIndex
CREATE INDEX "discount_usages_discountId_idx" ON "discount_usages"("discountId");

-- CreateIndex
CREATE INDEX "discount_usages_employerId_idx" ON "discount_usages"("employerId");

-- CreateIndex
CREATE INDEX "discount_usages_createdAt_idx" ON "discount_usages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "resume_embeddings_seekerId_key" ON "resume_embeddings"("seekerId");

-- CreateIndex
CREATE INDEX "resume_embeddings_seekerId_idx" ON "resume_embeddings"("seekerId");

-- CreateIndex
CREATE INDEX "seeker_job_matches_seekerId_idx" ON "seeker_job_matches"("seekerId");

-- CreateIndex
CREATE INDEX "seeker_job_matches_jobId_idx" ON "seeker_job_matches"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "seeker_job_matches_seekerId_jobId_key" ON "seeker_job_matches"("seekerId", "jobId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_result_idx" ON "audit_logs"("result");

-- CreateIndex
CREATE INDEX "audit_logs_riskLevel_idx" ON "audit_logs"("riskLevel");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "permissions_isActive_idx" ON "permissions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_roles_name_key" ON "rbac_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_role_assignments_userId_idx" ON "user_role_assignments"("userId");

-- CreateIndex
CREATE INDEX "user_role_assignments_employerId_idx" ON "user_role_assignments"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_userId_roleId_employerId_key" ON "user_role_assignments"("userId", "roleId", "employerId");

-- CreateIndex
CREATE INDEX "user_permission_overrides_userId_idx" ON "user_permission_overrides"("userId");

-- CreateIndex
CREATE INDEX "user_permission_overrides_employerId_idx" ON "user_permission_overrides"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_overrides_userId_permissionId_employerId_key" ON "user_permission_overrides"("userId", "permissionId", "employerId");

-- CreateIndex
CREATE INDEX "admin_permissions_isActive_idx" ON "admin_permissions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_module_action_key" ON "admin_permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "admin_rbac_roles_name_key" ON "admin_rbac_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_permissions_roleId_permissionId_key" ON "admin_role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "admin_role_assignments_adminId_idx" ON "admin_role_assignments"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_role_assignments_adminId_roleId_key" ON "admin_role_assignments"("adminId", "roleId");

-- CreateIndex
CREATE INDEX "admin_permission_overrides_adminId_idx" ON "admin_permission_overrides"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permission_overrides_adminId_permissionId_key" ON "admin_permission_overrides"("adminId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_email_key" ON "admin_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_token_key" ON "admin_invites"("token");

-- CreateIndex
CREATE INDEX "admin_invites_token_idx" ON "admin_invites"("token");

-- CreateIndex
CREATE INDEX "admin_invites_status_idx" ON "admin_invites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "platform_settings_key_idx" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "content_reports_contentType_contentId_idx" ON "content_reports"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_reporterId_idx" ON "content_reports"("reporterId");

-- CreateIndex
CREATE INDEX "content_reports_createdAt_idx" ON "content_reports"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_profiles" ADD CONSTRAINT "job_seeker_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_profiles" ADD CONSTRAINT "job_seeker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ctf_profiles" ADD CONSTRAINT "ctf_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "skill_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_skills" ADD CONSTRAINT "job_seeker_skills_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_skills" ADD CONSTRAINT "job_seeker_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_certifications" ADD CONSTRAINT "job_seeker_certifications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_certifications" ADD CONSTRAINT "job_seeker_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employers" ADD CONSTRAINT "employers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_verifications" ADD CONSTRAINT "employer_verifications_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_verifications" ADD CONSTRAINT "employer_verifications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_verifications" ADD CONSTRAINT "employer_verifications_previousVerificationId_fkey" FOREIGN KEY ("previousVerificationId") REFERENCES "employer_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "office_locations" ADD CONSTRAINT "office_locations_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_benefits" ADD CONSTRAINT "company_benefits_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_media" ADD CONSTRAINT "company_media_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_certifications" ADD CONSTRAINT "job_certifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_certifications" ADD CONSTRAINT "job_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_views" ADD CONSTRAINT "company_profile_views_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profile_views" ADD CONSTRAINT "company_profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_settings" ADD CONSTRAINT "job_seeker_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_preferences" ADD CONSTRAINT "location_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_preferences" ADD CONSTRAINT "location_preferences_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_settings" ADD CONSTRAINT "employer_settings_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_auth_audit_logs" ADD CONSTRAINT "admin_auth_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_providers" ADD CONSTRAINT "user_oauth_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_members" ADD CONSTRAINT "employer_members_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_members" ADD CONSTRAINT "employer_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_subscriptions" ADD CONSTRAINT "employer_subscriptions_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_subscriptions" ADD CONSTRAINT "employer_subscriptions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "employer_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_packages" ADD CONSTRAINT "discount_packages_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_packages" ADD CONSTRAINT "discount_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_embeddings" ADD CONSTRAINT "resume_embeddings_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_job_matches" ADD CONSTRAINT "seeker_job_matches_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seeker_job_matches" ADD CONSTRAINT "seeker_job_matches_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_rbac_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_rbac_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
