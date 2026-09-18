--
-- PostgreSQL database dump
--

\restrict cTlIymQxDHEM9muYt1qo1L3mBlVuWGSLMF66lmCfohKHYggTfeUNMUGvqTAvawh

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.10 (Ubuntu 17.10-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AccountStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."AccountStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'DELETED',
    'DEACTIVATED'
);


ALTER TYPE public."AccountStatus" OWNER TO cykruit_admin;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'APPLIED',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public."ApplicationStatus" OWNER TO cykruit_admin;

--
-- Name: ApplicationType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."ApplicationType" AS ENUM (
    'DIRECT',
    'EXTERNAL',
    'SCREENING'
);


ALTER TYPE public."ApplicationType" OWNER TO cykruit_admin;

--
-- Name: CompanySize; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."CompanySize" AS ENUM (
    'SIZE_1_10',
    'SIZE_11_50',
    'SIZE_51_200',
    'SIZE_201_500',
    'SIZE_501_1000',
    'SIZE_1000_PLUS'
);


ALTER TYPE public."CompanySize" OWNER TO cykruit_admin;

--
-- Name: CompanyType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."CompanyType" AS ENUM (
    'COOPERATIVE_SOCIETY',
    'SOLE_PROPRIETORSHIP',
    'FAMILY_OWNED_BUSINESS',
    'PRIVATE_LIMITED_COMPANY',
    'PUBLIC_LIMITED_COMPANY',
    'EDUCATIONAL_INSTITUTION',
    'POLITICAL_PARTY',
    'NGO',
    'NATIONALISED_BANK',
    'PRIVATE_BANK',
    'LIFE_INSURANCE_COMPANY',
    'GENERAL_INSURANCE_COMPANY',
    'PARTNERSHIP_FIRM',
    'TRUST_CLUB_ASSOCIATION',
    'SEBI_APPROVED_BROKER',
    'OTHERS'
);


ALTER TYPE public."CompanyType" OWNER TO cykruit_admin;

--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."ConversationType" AS ENUM (
    'DIRECT',
    'JOB_INQUIRY'
);


ALTER TYPE public."ConversationType" OWNER TO cykruit_admin;

--
-- Name: DataRightsStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."DataRightsStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."DataRightsStatus" OWNER TO cykruit_admin;

--
-- Name: DataRightsType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."DataRightsType" AS ENUM (
    'EXPORT_DATA',
    'DELETE_ACCOUNT',
    'DEACTIVATE_ACCOUNT',
    'CORRECT_DATA',
    'GRIEVANCE',
    'NOMINATE',
    'WITHDRAW_CONSENT'
);


ALTER TYPE public."DataRightsType" OWNER TO cykruit_admin;

--
-- Name: DeliveryChannel; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."DeliveryChannel" AS ENUM (
    'WEBSOCKET',
    'EMAIL',
    'PUSH',
    'SMS'
);


ALTER TYPE public."DeliveryChannel" OWNER TO cykruit_admin;

--
-- Name: EmailFrequency; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."EmailFrequency" AS ENUM (
    'INSTANT',
    'DAILY',
    'WEEKLY',
    'DISABLED'
);


ALTER TYPE public."EmailFrequency" OWNER TO cykruit_admin;

--
-- Name: EmployerProfileVisibility; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."EmployerProfileVisibility" AS ENUM (
    'PUBLIC',
    'PRIVATE'
);


ALTER TYPE public."EmployerProfileVisibility" OWNER TO cykruit_admin;

--
-- Name: ExperienceLevel; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."ExperienceLevel" AS ENUM (
    'ENTRY',
    'MID',
    'SENIOR'
);


ALTER TYPE public."ExperienceLevel" OWNER TO cykruit_admin;

--
-- Name: Industry; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."Industry" AS ENUM (
    'TECHNOLOGY',
    'HEALTHCARE',
    'FINANCE',
    'EDUCATION',
    'RETAIL',
    'MANUFACTURING',
    'CONSULTING',
    'OTHER'
);


ALTER TYPE public."Industry" OWNER TO cykruit_admin;

--
-- Name: JobSearchStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."JobSearchStatus" AS ENUM (
    'ACTIVELY_LOOKING',
    'OPEN_TO_OFFERS',
    'NOT_LOOKING'
);


ALTER TYPE public."JobSearchStatus" OWNER TO cykruit_admin;

--
-- Name: JobStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."JobStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CLOSED',
    'EXPIRED'
);


ALTER TYPE public."JobStatus" OWNER TO cykruit_admin;

--
-- Name: JobType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."JobType" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'INTERNSHIP'
);


ALTER TYPE public."JobType" OWNER TO cykruit_admin;

--
-- Name: MessageStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."MessageStatus" AS ENUM (
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED'
);


ALTER TYPE public."MessageStatus" OWNER TO cykruit_admin;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'UNREAD',
    'READ',
    'ARCHIVED'
);


ALTER TYPE public."NotificationStatus" OWNER TO cykruit_admin;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."NotificationType" AS ENUM (
    'APPLICATION_SUBMITTED',
    'APPLICATION_STATUS',
    'APPLICATION_WITHDRAWN',
    'JOB_REJECTION',
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_UPDATED',
    'JOB_ALERT',
    'BOOKMARK_ALERT',
    'NEW_APPLICANT',
    'APPLICATION_UPDATE',
    'GROUPED_APPLICANTS',
    'JOB_EXPIRY_ALERT',
    'JOB_APPROVAL',
    'KYC_APPROVED',
    'KYC_REJECTED',
    'PLATFORM_ANNOUNCEMENT',
    'SYSTEM_ANNOUNCEMENT',
    'PROFILE_REMINDER',
    'FEEDBACK_RECEIVED',
    'CERTIFICATION_ALERT',
    'BUG_BOUNTY_ALERT'
);


ALTER TYPE public."NotificationType" OWNER TO cykruit_admin;

--
-- Name: OAuthProvider; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."OAuthProvider" AS ENUM (
    'GOOGLE',
    'GITHUB',
    'LINKEDIN',
    'MICROSOFT'
);


ALTER TYPE public."OAuthProvider" OWNER TO cykruit_admin;

--
-- Name: ProfileVisibility; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."ProfileVisibility" AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'ANONYMOUS'
);


ALTER TYPE public."ProfileVisibility" OWNER TO cykruit_admin;

--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."QuestionType" AS ENUM (
    'SHORT_ANSWER',
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE'
);


ALTER TYPE public."QuestionType" OWNER TO cykruit_admin;

--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."TokenType" AS ENUM (
    'EMAIL_VERIFICATION',
    'PASSWORD_RESET'
);


ALTER TYPE public."TokenType" OWNER TO cykruit_admin;

--
-- Name: TrainingEngagementType; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."TrainingEngagementType" AS ENUM (
    'PART_TIME',
    'FULL_TIME',
    'ONE_TIME_WORKSHOP'
);


ALTER TYPE public."TrainingEngagementType" OWNER TO cykruit_admin;

--
-- Name: TrainingMode; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."TrainingMode" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'BOTH'
);


ALTER TYPE public."TrainingMode" OWNER TO cykruit_admin;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."UserRole" AS ENUM (
    'SEEKER',
    'EMPLOYER'
);


ALTER TYPE public."UserRole" OWNER TO cykruit_admin;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."VerificationStatus" OWNER TO cykruit_admin;

--
-- Name: WorkMode; Type: TYPE; Schema: public; Owner: cykruit_admin
--

CREATE TYPE public."WorkMode" AS ENUM (
    'REMOTE',
    'ONSITE',
    'HYBRID'
);


ALTER TYPE public."WorkMode" OWNER TO cykruit_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Blog; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public."Blog" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text,
    category text,
    "coverImage" text,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Blog" OWNER TO cykruit_admin;

--
-- Name: ContactForm; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public."ContactForm" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ContactForm" OWNER TO cykruit_admin;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    location text,
    "eventDate" timestamp(3) without time zone NOT NULL,
    "bannerImage" text,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Event" OWNER TO cykruit_admin;

--
-- Name: GalleryItem; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public."GalleryItem" (
    id text NOT NULL,
    title text,
    "imageUrl" text NOT NULL,
    "altText" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."GalleryItem" OWNER TO cykruit_admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO cykruit_admin;

--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.admin_audit_logs (
    id text NOT NULL,
    "adminId" uuid NOT NULL,
    action text NOT NULL,
    resource text,
    "resourceId" text,
    "ipAddress" text,
    "userAgent" text,
    "oldData" jsonb,
    "newData" jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_audit_logs OWNER TO cykruit_admin;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.admin_sessions (
    id text NOT NULL,
    "adminId" uuid NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "rememberMe" boolean DEFAULT false NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_sessions OWNER TO cykruit_admin;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.admins (
    id uuid NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "profileImage" text,
    "lastLogin" timestamp(3) without time zone,
    "lastLoginIp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.admins OWNER TO cykruit_admin;

--
-- Name: application_notes; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.application_notes (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    note text NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.application_notes OWNER TO cykruit_admin;

--
-- Name: application_status_history; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.application_status_history (
    id text NOT NULL,
    "applicationId" text NOT NULL,
    "oldStatus" public."ApplicationStatus" NOT NULL,
    "newStatus" public."ApplicationStatus" NOT NULL,
    "changedBy" text NOT NULL,
    "changedById" text,
    reason text,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.application_status_history OWNER TO cykruit_admin;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.applications (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "seekerId" text NOT NULL,
    "screeningAnswers" jsonb,
    "resumeId" text,
    status public."ApplicationStatus" DEFAULT 'APPLIED'::public."ApplicationStatus" NOT NULL,
    "aiScore" integer,
    "aiScoreData" jsonb,
    "aiScoredAt" timestamp(3) without time zone,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.applications OWNER TO cykruit_admin;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.certifications (
    id text NOT NULL,
    name text NOT NULL,
    organization text NOT NULL,
    description text,
    "isVerified" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.certifications OWNER TO cykruit_admin;

--
-- Name: company_benefits; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.company_benefits (
    id text NOT NULL,
    "employerId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.company_benefits OWNER TO cykruit_admin;

--
-- Name: company_media; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.company_media (
    id text NOT NULL,
    "employerId" text NOT NULL,
    url text NOT NULL,
    title text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.company_media OWNER TO cykruit_admin;

--
-- Name: company_profile_views; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.company_profile_views (
    id text NOT NULL,
    "employerId" text NOT NULL,
    "viewerId" text NOT NULL,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text
);


ALTER TABLE public.company_profile_views OWNER TO cykruit_admin;

--
-- Name: consent_logs; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.consent_logs (
    id text NOT NULL,
    email text NOT NULL,
    "formSource" text NOT NULL,
    "consentVersion" text NOT NULL,
    "consentStatus" boolean NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "contactFormId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.consent_logs OWNER TO cykruit_admin;

--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.conversation_participants (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    role public."UserRole" NOT NULL,
    "unreadCount" integer DEFAULT 0 NOT NULL,
    "lastReadAt" timestamp(3) without time zone,
    "lastSeenAt" timestamp(3) without time zone,
    "isMuted" boolean DEFAULT false NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversation_participants OWNER TO cykruit_admin;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    type public."ConversationType" DEFAULT 'JOB_INQUIRY'::public."ConversationType" NOT NULL,
    "jobId" text,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastMessagePreview" character varying(200),
    "isArchived" boolean DEFAULT false NOT NULL,
    "archivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO cykruit_admin;

--
-- Name: ctf_profiles; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.ctf_profiles (
    id text NOT NULL,
    "profileId" text NOT NULL,
    platform text NOT NULL,
    username text NOT NULL,
    "profileUrl" text NOT NULL,
    rank text,
    points integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ctf_profiles OWNER TO cykruit_admin;

--
-- Name: data_rights_requests; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.data_rights_requests (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."DataRightsType" NOT NULL,
    status public."DataRightsStatus" DEFAULT 'PENDING'::public."DataRightsStatus" NOT NULL,
    description text,
    metadata jsonb,
    "adminNotes" text,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedBy" text,
    "scheduledDeleteAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_rights_requests OWNER TO cykruit_admin;

--
-- Name: education; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.education (
    id text NOT NULL,
    "profileId" text NOT NULL,
    degree text NOT NULL,
    "fieldOfStudy" text,
    "instituteId" text,
    "instituteName" text,
    "startDate" text,
    "endDate" text,
    grade text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.education OWNER TO cykruit_admin;

--
-- Name: employer_settings; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.employer_settings (
    id text NOT NULL,
    "employerId" text NOT NULL,
    "profileVisibility" public."EmployerProfileVisibility" DEFAULT 'PUBLIC'::public."EmployerProfileVisibility" NOT NULL,
    "showCompanyDetailsBeforeApply" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employer_settings OWNER TO cykruit_admin;

--
-- Name: employer_verifications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.employer_verifications (
    id text NOT NULL,
    "employerId" text NOT NULL,
    "companyName" text NOT NULL,
    "companyWebsite" text NOT NULL,
    "companyType" public."CompanyType" NOT NULL,
    industry public."Industry" NOT NULL,
    "companySize" public."CompanySize" NOT NULL,
    location text NOT NULL,
    "documentUrl" text NOT NULL,
    "documentKey" text NOT NULL,
    "documentFileName" text NOT NULL,
    status public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "submissionCount" integer DEFAULT 1 NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "reviewedBy" uuid,
    "reviewedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "adminNotes" text,
    "previousVerificationId" text,
    "statusHistory" jsonb[] DEFAULT ARRAY[]::jsonb[],
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employer_verifications OWNER TO cykruit_admin;

--
-- Name: employers; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.employers (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyName" text NOT NULL,
    "companyType" public."CompanyType" NOT NULL,
    industry public."Industry" NOT NULL,
    "companySize" public."CompanySize" NOT NULL,
    location text NOT NULL,
    slug text NOT NULL,
    "companyWebsite" text,
    "contactEmail" text,
    "foundedYear" integer,
    tagline text,
    "cultureDescription" text,
    "companyLogo" text,
    "companyBanner" text,
    about text,
    mission text,
    vision text,
    linkedin text,
    twitter text,
    facebook text,
    instagram text,
    "profileCompletion" integer DEFAULT 0 NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedBy" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFlagged" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.employers OWNER TO cykruit_admin;

--
-- Name: experiences; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.experiences (
    id text NOT NULL,
    "profileId" text NOT NULL,
    title text NOT NULL,
    company text NOT NULL,
    location text NOT NULL,
    "employmentType" text,
    "startDate" text NOT NULL,
    "endDate" text,
    current boolean DEFAULT false NOT NULL,
    description text NOT NULL,
    tools text[],
    achievements text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.experiences OWNER TO cykruit_admin;

--
-- Name: institutes; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.institutes (
    id text NOT NULL,
    name text NOT NULL,
    city text,
    state text,
    country text,
    "isVerified" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.institutes OWNER TO cykruit_admin;

--
-- Name: ircsp_registrations; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.ircsp_registrations (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    "collegeName" text NOT NULL,
    branch text NOT NULL,
    "yearOfStudy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ircsp_registrations OWNER TO cykruit_admin;

--
-- Name: job_certifications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_certifications (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "certificationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_certifications OWNER TO cykruit_admin;

--
-- Name: job_seeker_certifications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_seeker_certifications (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "certificationId" text NOT NULL,
    "issueDate" text NOT NULL,
    "expiryDate" text,
    "credentialId" text,
    "credentialUrl" text,
    "certificateFile" text,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_seeker_certifications OWNER TO cykruit_admin;

--
-- Name: job_seeker_profiles; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_seeker_profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    title text,
    "professionalSummary" text,
    "locationId" text,
    linkedin text,
    github text,
    portfolio text,
    availability text DEFAULT 'Open to offers'::text NOT NULL,
    "profileCompletion" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.job_seeker_profiles OWNER TO cykruit_admin;

--
-- Name: job_seeker_settings; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_seeker_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "profileVisibility" public."ProfileVisibility" DEFAULT 'PUBLIC'::public."ProfileVisibility" NOT NULL,
    "jobSearchStatus" public."JobSearchStatus" DEFAULT 'ACTIVELY_LOOKING'::public."JobSearchStatus" NOT NULL,
    "availableFrom" timestamp(3) without time zone,
    "preferredJobTypes" public."JobType"[] DEFAULT ARRAY[]::public."JobType"[],
    "preferredWorkModes" public."WorkMode"[] DEFAULT ARRAY[]::public."WorkMode"[],
    "willingToRelocate" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.job_seeker_settings OWNER TO cykruit_admin;

--
-- Name: job_seeker_skills; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_seeker_skills (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "skillId" text NOT NULL,
    proficiency text NOT NULL,
    "yearsOfExperience" integer,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_seeker_skills OWNER TO cykruit_admin;

--
-- Name: job_skills; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_skills (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "skillId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_skills OWNER TO cykruit_admin;

--
-- Name: job_views; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.job_views (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "viewerId" text NOT NULL,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.job_views OWNER TO cykruit_admin;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.jobs (
    id text NOT NULL,
    "employerId" text NOT NULL,
    "jobTitle" text,
    slug text NOT NULL,
    "roleId" text,
    "jobType" public."JobType" NOT NULL,
    "contractDuration" integer,
    "workMode" public."WorkMode" NOT NULL,
    "locationId" text,
    "experienceLevel" public."ExperienceLevel" NOT NULL,
    description text,
    "applicationType" public."ApplicationType" NOT NULL,
    "externalUrl" text,
    "screeningQuestions" jsonb,
    status public."JobStatus" NOT NULL,
    "rejectionReason" text,
    "closedReason" character varying(200),
    "closedAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "applicationCount" integer DEFAULT 0 NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.jobs OWNER TO cykruit_admin;

--
-- Name: location_preferences; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.location_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "locationId" text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.location_preferences OWNER TO cykruit_admin;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.locations (
    id text NOT NULL,
    city text NOT NULL,
    state text,
    country text NOT NULL,
    "displayName" text NOT NULL,
    "searchText" text NOT NULL,
    "isPopular" boolean DEFAULT false NOT NULL,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.locations OWNER TO cykruit_admin;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.messages (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "encryptedContent" text NOT NULL,
    "contentHash" text,
    iv text,
    type text DEFAULT 'text'::text NOT NULL,
    "fileUrl" text,
    "fileName" text,
    "fileSize" integer,
    "fileMimeType" text,
    status public."MessageStatus" DEFAULT 'SENT'::public."MessageStatus" NOT NULL,
    "readBy" text[] DEFAULT ARRAY[]::text[],
    "readAt" timestamp(3) without time zone,
    "deliveredTo" text[] DEFAULT ARRAY[]::text[],
    "deliveredAt" timestamp(3) without time zone,
    "isEdited" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "replyToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO cykruit_admin;

--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.notification_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "enableInApp" boolean DEFAULT true NOT NULL,
    "enableEmail" boolean DEFAULT true NOT NULL,
    "applicationSubmitted_inApp" boolean DEFAULT true NOT NULL,
    "applicationSubmitted_email" boolean DEFAULT true NOT NULL,
    "applicationStatus_inApp" boolean DEFAULT true NOT NULL,
    "applicationStatus_email" boolean DEFAULT true NOT NULL,
    "jobRejection_inApp" boolean DEFAULT true NOT NULL,
    "jobRejection_email" boolean DEFAULT false NOT NULL,
    "interviewScheduled_inApp" boolean DEFAULT true NOT NULL,
    "interviewScheduled_email" boolean DEFAULT true NOT NULL,
    "jobAlert_inApp" boolean DEFAULT true NOT NULL,
    "jobAlert_email" boolean DEFAULT true NOT NULL,
    "jobAlert_frequency" public."EmailFrequency" DEFAULT 'INSTANT'::public."EmailFrequency" NOT NULL,
    "newApplicant_inApp" boolean DEFAULT true NOT NULL,
    "newApplicant_email" boolean DEFAULT true NOT NULL,
    "applicationUpdate_inApp" boolean DEFAULT true NOT NULL,
    "applicationUpdate_email" boolean DEFAULT false NOT NULL,
    "groupedApplicants_inApp" boolean DEFAULT true NOT NULL,
    "groupedApplicants_email" boolean DEFAULT true NOT NULL,
    "groupedApplicants_frequency" public."EmailFrequency" DEFAULT 'DAILY'::public."EmailFrequency" NOT NULL,
    "jobExpiryAlert_inApp" boolean DEFAULT true NOT NULL,
    "jobExpiryAlert_email" boolean DEFAULT true NOT NULL,
    "jobApproval_inApp" boolean DEFAULT true NOT NULL,
    "jobApproval_email" boolean DEFAULT true NOT NULL,
    "kycApproved_inApp" boolean DEFAULT true NOT NULL,
    "kycApproved_email" boolean DEFAULT true NOT NULL,
    "kycRejected_inApp" boolean DEFAULT true NOT NULL,
    "kycRejected_email" boolean DEFAULT true NOT NULL,
    "platformAnnouncement_inApp" boolean DEFAULT true NOT NULL,
    "platformAnnouncement_email" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_preferences OWNER TO cykruit_admin;

--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.notification_queue (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobType" text NOT NULL,
    "notificationId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "maxRetries" integer DEFAULT 3 NOT NULL,
    "scheduledFor" timestamp(3) without time zone,
    "processedAt" timestamp(3) without time zone,
    "lastError" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_queue OWNER TO cykruit_admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    status public."NotificationStatus" DEFAULT 'UNREAD'::public."NotificationStatus" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "actionUrl" text,
    "actionText" text,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "relatedEntityType" text,
    "relatedEntityId" text,
    metadata jsonb,
    "deliveredVia" public."DeliveryChannel"[],
    "emailSentAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO cykruit_admin;

--
-- Name: office_locations; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.office_locations (
    id text NOT NULL,
    "employerId" text NOT NULL,
    type text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    country text NOT NULL,
    "isHeadquarters" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.office_locations OWNER TO cykruit_admin;

--
-- Name: profile_views; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.profile_views (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "viewerType" text NOT NULL,
    "viewerId" text,
    "jobId" text,
    "ipAddress" text,
    "userAgent" text,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.profile_views OWNER TO cykruit_admin;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.projects (
    id text NOT NULL,
    "profileId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    technologies text[],
    "projectUrl" text,
    "startDate" text,
    "endDate" text,
    current boolean DEFAULT false NOT NULL,
    highlights text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.projects OWNER TO cykruit_admin;

--
-- Name: resumes; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.resumes (
    id text NOT NULL,
    "profileId" text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileSize" integer NOT NULL,
    "fileType" text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.resumes OWNER TO cykruit_admin;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO cykruit_admin;

--
-- Name: saved_jobs; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.saved_jobs (
    id text NOT NULL,
    "seekerId" text NOT NULL,
    "jobId" text NOT NULL,
    note text,
    "savedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.saved_jobs OWNER TO cykruit_admin;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "rememberMe" boolean DEFAULT false NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sessions OWNER TO cykruit_admin;

--
-- Name: skill_categories; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.skill_categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.skill_categories OWNER TO cykruit_admin;

--
-- Name: skills; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.skills (
    id text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL,
    description text,
    "isVerified" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.skills OWNER TO cykruit_admin;

--
-- Name: team_members; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.team_members (
    id text NOT NULL,
    "employerId" text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    email text NOT NULL,
    "profileImage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.team_members OWNER TO cykruit_admin;

--
-- Name: tokens; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.tokens (
    id text NOT NULL,
    token text NOT NULL,
    type public."TokenType" NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tokens OWNER TO cykruit_admin;

--
-- Name: trainer_certifications; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.trainer_certifications (
    id text NOT NULL,
    "trainerId" text NOT NULL,
    "certificationId" text,
    "issueDate" text NOT NULL,
    "expiryDate" text,
    "credentialId" text,
    "credentialUrl" text,
    "certificateFile" text,
    "certificateFileKey" text,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "certName" text NOT NULL,
    "certOrg" text
);


ALTER TABLE public.trainer_certifications OWNER TO cykruit_admin;

--
-- Name: trainers; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.trainers (
    id text NOT NULL,
    email text NOT NULL,
    "fullName" text NOT NULL,
    phone text,
    location text,
    linkedin text,
    "yearsOfExperience" integer NOT NULL,
    "currentJobTitle" text,
    organization text,
    bio text,
    domains text[],
    "trainingMode" public."TrainingMode" DEFAULT 'BOTH'::public."TrainingMode" NOT NULL,
    "trainingLanguages" text[],
    "pastOrganizations" text[],
    "approximatePeopleTrained" integer,
    "topicsCovered" text,
    "engagementType" public."TrainingEngagementType"[] DEFAULT ARRAY[]::public."TrainingEngagementType"[],
    "profileImage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.trainers OWNER TO cykruit_admin;

--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.user_consents (
    id text NOT NULL,
    "userId" text NOT NULL,
    "consentVersion" text NOT NULL,
    "acceptedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text,
    "userAgent" text
);


ALTER TABLE public.user_consents OWNER TO cykruit_admin;

--
-- Name: user_oauth_providers; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.user_oauth_providers (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider public."OAuthProvider" NOT NULL,
    "providerId" text NOT NULL,
    email text,
    name text,
    picture text,
    "accessToken" text,
    "refreshToken" text,
    "expiresAt" timestamp(3) without time zone,
    "linkedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_oauth_providers OWNER TO cykruit_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: cykruit_admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    role public."UserRole" NOT NULL,
    "profileImage" text,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "emailVerifiedAt" timestamp(3) without time zone,
    status public."AccountStatus" DEFAULT 'PENDING'::public."AccountStatus" NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "lastLoginIp" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "consentWithdrawnAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO cykruit_admin;

--
-- Name: Blog Blog_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public."Blog"
    ADD CONSTRAINT "Blog_pkey" PRIMARY KEY (id);


--
-- Name: ContactForm ContactForm_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public."ContactForm"
    ADD CONSTRAINT "ContactForm_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: GalleryItem GalleryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public."GalleryItem"
    ADD CONSTRAINT "GalleryItem_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: application_notes application_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.application_notes
    ADD CONSTRAINT application_notes_pkey PRIMARY KEY (id);


--
-- Name: application_status_history application_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.application_status_history
    ADD CONSTRAINT application_status_history_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: company_benefits company_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_benefits
    ADD CONSTRAINT company_benefits_pkey PRIMARY KEY (id);


--
-- Name: company_media company_media_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_media
    ADD CONSTRAINT company_media_pkey PRIMARY KEY (id);


--
-- Name: company_profile_views company_profile_views_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_profile_views
    ADD CONSTRAINT company_profile_views_pkey PRIMARY KEY (id);


--
-- Name: consent_logs consent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.consent_logs
    ADD CONSTRAINT consent_logs_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: ctf_profiles ctf_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.ctf_profiles
    ADD CONSTRAINT ctf_profiles_pkey PRIMARY KEY (id);


--
-- Name: data_rights_requests data_rights_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.data_rights_requests
    ADD CONSTRAINT data_rights_requests_pkey PRIMARY KEY (id);


--
-- Name: education education_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT education_pkey PRIMARY KEY (id);


--
-- Name: employer_settings employer_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employer_settings
    ADD CONSTRAINT employer_settings_pkey PRIMARY KEY (id);


--
-- Name: employer_verifications employer_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employer_verifications
    ADD CONSTRAINT employer_verifications_pkey PRIMARY KEY (id);


--
-- Name: employers employers_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: institutes institutes_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.institutes
    ADD CONSTRAINT institutes_pkey PRIMARY KEY (id);


--
-- Name: ircsp_registrations ircsp_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.ircsp_registrations
    ADD CONSTRAINT ircsp_registrations_pkey PRIMARY KEY (id);


--
-- Name: job_certifications job_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_certifications
    ADD CONSTRAINT job_certifications_pkey PRIMARY KEY (id);


--
-- Name: job_seeker_certifications job_seeker_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_certifications
    ADD CONSTRAINT job_seeker_certifications_pkey PRIMARY KEY (id);


--
-- Name: job_seeker_profiles job_seeker_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_profiles
    ADD CONSTRAINT job_seeker_profiles_pkey PRIMARY KEY (id);


--
-- Name: job_seeker_settings job_seeker_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_settings
    ADD CONSTRAINT job_seeker_settings_pkey PRIMARY KEY (id);


--
-- Name: job_seeker_skills job_seeker_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_skills
    ADD CONSTRAINT job_seeker_skills_pkey PRIMARY KEY (id);


--
-- Name: job_skills job_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_pkey PRIMARY KEY (id);


--
-- Name: job_views job_views_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_views
    ADD CONSTRAINT job_views_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: location_preferences location_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.location_preferences
    ADD CONSTRAINT location_preferences_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: office_locations office_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.office_locations
    ADD CONSTRAINT office_locations_pkey PRIMARY KEY (id);


--
-- Name: profile_views profile_views_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: saved_jobs saved_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: skill_categories skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: trainer_certifications trainer_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.trainer_certifications
    ADD CONSTRAINT trainer_certifications_pkey PRIMARY KEY (id);


--
-- Name: trainers trainers_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.trainers
    ADD CONSTRAINT trainers_pkey PRIMARY KEY (id);


--
-- Name: user_consents user_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);


--
-- Name: user_oauth_providers user_oauth_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.user_oauth_providers
    ADD CONSTRAINT user_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Blog_slug_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "Blog_slug_key" ON public."Blog" USING btree (slug);


--
-- Name: ContactForm_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "ContactForm_createdAt_idx" ON public."ContactForm" USING btree ("createdAt");


--
-- Name: ContactForm_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "ContactForm_email_idx" ON public."ContactForm" USING btree (email);


--
-- Name: ContactForm_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "ContactForm_status_idx" ON public."ContactForm" USING btree (status);


--
-- Name: admin_audit_logs_action_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX admin_audit_logs_action_idx ON public.admin_audit_logs USING btree (action);


--
-- Name: admin_audit_logs_adminId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "admin_audit_logs_adminId_idx" ON public.admin_audit_logs USING btree ("adminId");


--
-- Name: admin_audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "admin_audit_logs_createdAt_idx" ON public.admin_audit_logs USING btree ("createdAt");


--
-- Name: admin_audit_logs_resource_resourceId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "admin_audit_logs_resource_resourceId_idx" ON public.admin_audit_logs USING btree (resource, "resourceId");


--
-- Name: admin_sessions_adminId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "admin_sessions_adminId_idx" ON public.admin_sessions USING btree ("adminId");


--
-- Name: admin_sessions_expiresAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "admin_sessions_expiresAt_idx" ON public.admin_sessions USING btree ("expiresAt");


--
-- Name: admin_sessions_token_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX admin_sessions_token_idx ON public.admin_sessions USING btree (token);


--
-- Name: admin_sessions_token_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX admin_sessions_token_key ON public.admin_sessions USING btree (token);


--
-- Name: admins_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX admins_email_idx ON public.admins USING btree (email);


--
-- Name: admins_email_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);


--
-- Name: application_notes_applicationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "application_notes_applicationId_idx" ON public.application_notes USING btree ("applicationId");


--
-- Name: application_status_history_applicationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "application_status_history_applicationId_idx" ON public.application_status_history USING btree ("applicationId");


--
-- Name: applications_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "applications_jobId_idx" ON public.applications USING btree ("jobId");


--
-- Name: applications_jobId_seekerId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "applications_jobId_seekerId_key" ON public.applications USING btree ("jobId", "seekerId");


--
-- Name: applications_seekerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "applications_seekerId_idx" ON public.applications USING btree ("seekerId");


--
-- Name: applications_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX applications_status_idx ON public.applications USING btree (status);


--
-- Name: certifications_name_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX certifications_name_idx ON public.certifications USING btree (name);


--
-- Name: certifications_name_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX certifications_name_key ON public.certifications USING btree (name);


--
-- Name: certifications_organization_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX certifications_organization_idx ON public.certifications USING btree (organization);


--
-- Name: company_benefits_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "company_benefits_employerId_idx" ON public.company_benefits USING btree ("employerId");


--
-- Name: company_media_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "company_media_employerId_idx" ON public.company_media USING btree ("employerId");


--
-- Name: company_media_employerId_order_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "company_media_employerId_order_idx" ON public.company_media USING btree ("employerId", "order");


--
-- Name: company_profile_views_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "company_profile_views_employerId_idx" ON public.company_profile_views USING btree ("employerId");


--
-- Name: company_profile_views_employerId_viewerId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "company_profile_views_employerId_viewerId_key" ON public.company_profile_views USING btree ("employerId", "viewerId");


--
-- Name: company_profile_views_viewerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "company_profile_views_viewerId_idx" ON public.company_profile_views USING btree ("viewerId");


--
-- Name: consent_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "consent_logs_createdAt_idx" ON public.consent_logs USING btree ("createdAt");


--
-- Name: consent_logs_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX consent_logs_email_idx ON public.consent_logs USING btree (email);


--
-- Name: consent_logs_formSource_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "consent_logs_formSource_idx" ON public.consent_logs USING btree ("formSource");


--
-- Name: conversation_participants_conversationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "conversation_participants_conversationId_idx" ON public.conversation_participants USING btree ("conversationId");


--
-- Name: conversation_participants_conversationId_userId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON public.conversation_participants USING btree ("conversationId", "userId");


--
-- Name: conversation_participants_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "conversation_participants_userId_idx" ON public.conversation_participants USING btree ("userId");


--
-- Name: conversation_participants_userId_unreadCount_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "conversation_participants_userId_unreadCount_idx" ON public.conversation_participants USING btree ("userId", "unreadCount");


--
-- Name: conversations_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "conversations_createdAt_idx" ON public.conversations USING btree ("createdAt");


--
-- Name: conversations_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "conversations_jobId_idx" ON public.conversations USING btree ("jobId");


--
-- Name: conversations_lastMessageAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "conversations_lastMessageAt_idx" ON public.conversations USING btree ("lastMessageAt");


--
-- Name: ctf_profiles_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "ctf_profiles_profileId_idx" ON public.ctf_profiles USING btree ("profileId");


--
-- Name: data_rights_requests_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX data_rights_requests_status_idx ON public.data_rights_requests USING btree (status);


--
-- Name: data_rights_requests_type_scheduledDeleteAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "data_rights_requests_type_scheduledDeleteAt_idx" ON public.data_rights_requests USING btree (type, "scheduledDeleteAt");


--
-- Name: data_rights_requests_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "data_rights_requests_userId_idx" ON public.data_rights_requests USING btree ("userId");


--
-- Name: education_instituteId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "education_instituteId_idx" ON public.education USING btree ("instituteId");


--
-- Name: education_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "education_profileId_idx" ON public.education USING btree ("profileId");


--
-- Name: employer_settings_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employer_settings_employerId_idx" ON public.employer_settings USING btree ("employerId");


--
-- Name: employer_settings_employerId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "employer_settings_employerId_key" ON public.employer_settings USING btree ("employerId");


--
-- Name: employer_settings_profileVisibility_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employer_settings_profileVisibility_idx" ON public.employer_settings USING btree ("profileVisibility");


--
-- Name: employer_verifications_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employer_verifications_employerId_idx" ON public.employer_verifications USING btree ("employerId");


--
-- Name: employer_verifications_isLatest_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employer_verifications_isLatest_idx" ON public.employer_verifications USING btree ("isLatest");


--
-- Name: employer_verifications_reviewedBy_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employer_verifications_reviewedBy_idx" ON public.employer_verifications USING btree ("reviewedBy");


--
-- Name: employer_verifications_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX employer_verifications_status_idx ON public.employer_verifications USING btree (status);


--
-- Name: employer_verifications_submittedAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employer_verifications_submittedAt_idx" ON public.employer_verifications USING btree ("submittedAt");


--
-- Name: employers_companyType_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employers_companyType_idx" ON public.employers USING btree ("companyType");


--
-- Name: employers_industry_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX employers_industry_idx ON public.employers USING btree (industry);


--
-- Name: employers_isVerified_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "employers_isVerified_idx" ON public.employers USING btree ("isVerified");


--
-- Name: employers_slug_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX employers_slug_idx ON public.employers USING btree (slug);


--
-- Name: employers_slug_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX employers_slug_key ON public.employers USING btree (slug);


--
-- Name: employers_userId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "employers_userId_key" ON public.employers USING btree ("userId");


--
-- Name: experiences_current_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX experiences_current_idx ON public.experiences USING btree (current);


--
-- Name: experiences_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "experiences_profileId_idx" ON public.experiences USING btree ("profileId");


--
-- Name: institutes_country_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX institutes_country_idx ON public.institutes USING btree (country);


--
-- Name: institutes_name_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX institutes_name_idx ON public.institutes USING btree (name);


--
-- Name: institutes_name_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX institutes_name_key ON public.institutes USING btree (name);


--
-- Name: ircsp_registrations_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "ircsp_registrations_createdAt_idx" ON public.ircsp_registrations USING btree ("createdAt");


--
-- Name: ircsp_registrations_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX ircsp_registrations_email_idx ON public.ircsp_registrations USING btree (email);


--
-- Name: ircsp_registrations_email_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX ircsp_registrations_email_key ON public.ircsp_registrations USING btree (email);


--
-- Name: job_certifications_certificationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_certifications_certificationId_idx" ON public.job_certifications USING btree ("certificationId");


--
-- Name: job_certifications_jobId_certificationId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_certifications_jobId_certificationId_key" ON public.job_certifications USING btree ("jobId", "certificationId");


--
-- Name: job_certifications_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_certifications_jobId_idx" ON public.job_certifications USING btree ("jobId");


--
-- Name: job_seeker_certifications_certificationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_certifications_certificationId_idx" ON public.job_seeker_certifications USING btree ("certificationId");


--
-- Name: job_seeker_certifications_profileId_certificationId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_seeker_certifications_profileId_certificationId_key" ON public.job_seeker_certifications USING btree ("profileId", "certificationId");


--
-- Name: job_seeker_certifications_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_certifications_profileId_idx" ON public.job_seeker_certifications USING btree ("profileId");


--
-- Name: job_seeker_profiles_locationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_profiles_locationId_idx" ON public.job_seeker_profiles USING btree ("locationId");


--
-- Name: job_seeker_profiles_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_profiles_userId_idx" ON public.job_seeker_profiles USING btree ("userId");


--
-- Name: job_seeker_profiles_userId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_seeker_profiles_userId_key" ON public.job_seeker_profiles USING btree ("userId");


--
-- Name: job_seeker_settings_jobSearchStatus_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_settings_jobSearchStatus_idx" ON public.job_seeker_settings USING btree ("jobSearchStatus");


--
-- Name: job_seeker_settings_jobSearchStatus_profileVisibility_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_settings_jobSearchStatus_profileVisibility_idx" ON public.job_seeker_settings USING btree ("jobSearchStatus", "profileVisibility");


--
-- Name: job_seeker_settings_profileVisibility_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_settings_profileVisibility_idx" ON public.job_seeker_settings USING btree ("profileVisibility");


--
-- Name: job_seeker_settings_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_settings_userId_idx" ON public.job_seeker_settings USING btree ("userId");


--
-- Name: job_seeker_settings_userId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_seeker_settings_userId_key" ON public.job_seeker_settings USING btree ("userId");


--
-- Name: job_seeker_skills_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_skills_profileId_idx" ON public.job_seeker_skills USING btree ("profileId");


--
-- Name: job_seeker_skills_profileId_skillId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_seeker_skills_profileId_skillId_key" ON public.job_seeker_skills USING btree ("profileId", "skillId");


--
-- Name: job_seeker_skills_skillId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_seeker_skills_skillId_idx" ON public.job_seeker_skills USING btree ("skillId");


--
-- Name: job_skills_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_skills_jobId_idx" ON public.job_skills USING btree ("jobId");


--
-- Name: job_skills_jobId_skillId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_skills_jobId_skillId_key" ON public.job_skills USING btree ("jobId", "skillId");


--
-- Name: job_skills_skillId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_skills_skillId_idx" ON public.job_skills USING btree ("skillId");


--
-- Name: job_views_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_views_jobId_idx" ON public.job_views USING btree ("jobId");


--
-- Name: job_views_jobId_viewerId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "job_views_jobId_viewerId_key" ON public.job_views USING btree ("jobId", "viewerId");


--
-- Name: job_views_viewerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "job_views_viewerId_idx" ON public.job_views USING btree ("viewerId");


--
-- Name: jobs_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_createdAt_idx" ON public.jobs USING btree ("createdAt");


--
-- Name: jobs_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_employerId_idx" ON public.jobs USING btree ("employerId");


--
-- Name: jobs_expiresAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_expiresAt_idx" ON public.jobs USING btree ("expiresAt");


--
-- Name: jobs_jobType_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_jobType_idx" ON public.jobs USING btree ("jobType");


--
-- Name: jobs_locationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_locationId_idx" ON public.jobs USING btree ("locationId");


--
-- Name: jobs_roleId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_roleId_idx" ON public.jobs USING btree ("roleId");


--
-- Name: jobs_slug_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX jobs_slug_idx ON public.jobs USING btree (slug);


--
-- Name: jobs_slug_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX jobs_slug_key ON public.jobs USING btree (slug);


--
-- Name: jobs_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX jobs_status_idx ON public.jobs USING btree (status);


--
-- Name: jobs_workMode_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "jobs_workMode_idx" ON public.jobs USING btree ("workMode");


--
-- Name: location_preferences_locationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "location_preferences_locationId_idx" ON public.location_preferences USING btree ("locationId");


--
-- Name: location_preferences_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "location_preferences_userId_idx" ON public.location_preferences USING btree ("userId");


--
-- Name: location_preferences_userId_locationId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "location_preferences_userId_locationId_key" ON public.location_preferences USING btree ("userId", "locationId");


--
-- Name: location_preferences_userId_priority_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "location_preferences_userId_priority_idx" ON public.location_preferences USING btree ("userId", priority);


--
-- Name: locations_city_state_country_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX locations_city_state_country_key ON public.locations USING btree (city, state, country);


--
-- Name: locations_isPopular_usageCount_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "locations_isPopular_usageCount_idx" ON public.locations USING btree ("isPopular", "usageCount");


--
-- Name: locations_searchText_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "locations_searchText_idx" ON public.locations USING btree ("searchText");


--
-- Name: messages_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "messages_conversationId_createdAt_idx" ON public.messages USING btree ("conversationId", "createdAt");


--
-- Name: messages_conversationId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "messages_conversationId_idx" ON public.messages USING btree ("conversationId");


--
-- Name: messages_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "messages_createdAt_idx" ON public.messages USING btree ("createdAt");


--
-- Name: messages_replyToId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "messages_replyToId_idx" ON public.messages USING btree ("replyToId");


--
-- Name: messages_senderId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "messages_senderId_idx" ON public.messages USING btree ("senderId");


--
-- Name: messages_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX messages_status_idx ON public.messages USING btree (status);


--
-- Name: notification_preferences_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notification_preferences_userId_idx" ON public.notification_preferences USING btree ("userId");


--
-- Name: notification_preferences_userId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "notification_preferences_userId_key" ON public.notification_preferences USING btree ("userId");


--
-- Name: notification_queue_scheduledFor_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notification_queue_scheduledFor_idx" ON public.notification_queue USING btree ("scheduledFor");


--
-- Name: notification_queue_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX notification_queue_status_idx ON public.notification_queue USING btree (status);


--
-- Name: notification_queue_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notification_queue_userId_idx" ON public.notification_queue USING btree ("userId");


--
-- Name: notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notifications_createdAt_idx" ON public.notifications USING btree ("createdAt");


--
-- Name: notifications_expiresAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notifications_expiresAt_idx" ON public.notifications USING btree ("expiresAt");


--
-- Name: notifications_relatedEntityType_relatedEntityId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notifications_relatedEntityType_relatedEntityId_idx" ON public.notifications USING btree ("relatedEntityType", "relatedEntityId");


--
-- Name: notifications_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX notifications_status_idx ON public.notifications USING btree (status);


--
-- Name: notifications_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notifications_userId_idx" ON public.notifications USING btree ("userId");


--
-- Name: notifications_userId_isRead_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notifications_userId_isRead_idx" ON public.notifications USING btree ("userId", "isRead");


--
-- Name: notifications_userId_type_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "notifications_userId_type_idx" ON public.notifications USING btree ("userId", type);


--
-- Name: office_locations_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "office_locations_employerId_idx" ON public.office_locations USING btree ("employerId");


--
-- Name: office_locations_employerId_isHeadquarters_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "office_locations_employerId_isHeadquarters_idx" ON public.office_locations USING btree ("employerId", "isHeadquarters");


--
-- Name: profile_views_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "profile_views_jobId_idx" ON public.profile_views USING btree ("jobId");


--
-- Name: profile_views_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "profile_views_profileId_idx" ON public.profile_views USING btree ("profileId");


--
-- Name: profile_views_profileId_viewerId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "profile_views_profileId_viewerId_key" ON public.profile_views USING btree ("profileId", "viewerId");


--
-- Name: profile_views_viewedAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "profile_views_viewedAt_idx" ON public.profile_views USING btree ("viewedAt");


--
-- Name: profile_views_viewerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "profile_views_viewerId_idx" ON public.profile_views USING btree ("viewerId");


--
-- Name: projects_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "projects_profileId_idx" ON public.projects USING btree ("profileId");


--
-- Name: resumes_profileId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "resumes_profileId_idx" ON public.resumes USING btree ("profileId");


--
-- Name: roles_category_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX roles_category_idx ON public.roles USING btree (category);


--
-- Name: roles_name_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX roles_name_idx ON public.roles USING btree (name);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: saved_jobs_jobId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "saved_jobs_jobId_idx" ON public.saved_jobs USING btree ("jobId");


--
-- Name: saved_jobs_savedAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "saved_jobs_savedAt_idx" ON public.saved_jobs USING btree ("savedAt");


--
-- Name: saved_jobs_seekerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "saved_jobs_seekerId_idx" ON public.saved_jobs USING btree ("seekerId");


--
-- Name: saved_jobs_seekerId_jobId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "saved_jobs_seekerId_jobId_key" ON public.saved_jobs USING btree ("seekerId", "jobId");


--
-- Name: sessions_expiresAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "sessions_expiresAt_idx" ON public.sessions USING btree ("expiresAt");


--
-- Name: sessions_token_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX sessions_token_idx ON public.sessions USING btree (token);


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: skill_categories_name_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX skill_categories_name_key ON public.skill_categories USING btree (name);


--
-- Name: skills_categoryId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "skills_categoryId_idx" ON public.skills USING btree ("categoryId");


--
-- Name: skills_name_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX skills_name_idx ON public.skills USING btree (name);


--
-- Name: skills_name_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX skills_name_key ON public.skills USING btree (name);


--
-- Name: team_members_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX team_members_email_idx ON public.team_members USING btree (email);


--
-- Name: team_members_employerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "team_members_employerId_idx" ON public.team_members USING btree ("employerId");


--
-- Name: tokens_expiresAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "tokens_expiresAt_idx" ON public.tokens USING btree ("expiresAt");


--
-- Name: tokens_token_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX tokens_token_idx ON public.tokens USING btree (token);


--
-- Name: tokens_token_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX tokens_token_key ON public.tokens USING btree (token);


--
-- Name: tokens_userId_type_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "tokens_userId_type_idx" ON public.tokens USING btree ("userId", type);


--
-- Name: trainer_certifications_certName_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "trainer_certifications_certName_idx" ON public.trainer_certifications USING btree ("certName");


--
-- Name: trainer_certifications_trainerId_certName_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "trainer_certifications_trainerId_certName_key" ON public.trainer_certifications USING btree ("trainerId", "certName");


--
-- Name: trainer_certifications_trainerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "trainer_certifications_trainerId_idx" ON public.trainer_certifications USING btree ("trainerId");


--
-- Name: trainers_createdAt_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "trainers_createdAt_idx" ON public.trainers USING btree ("createdAt");


--
-- Name: trainers_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX trainers_email_idx ON public.trainers USING btree (email);


--
-- Name: trainers_email_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX trainers_email_key ON public.trainers USING btree (email);


--
-- Name: user_consents_consentVersion_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "user_consents_consentVersion_idx" ON public.user_consents USING btree ("consentVersion");


--
-- Name: user_consents_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "user_consents_userId_idx" ON public.user_consents USING btree ("userId");


--
-- Name: user_oauth_providers_provider_providerId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "user_oauth_providers_provider_providerId_idx" ON public.user_oauth_providers USING btree (provider, "providerId");


--
-- Name: user_oauth_providers_provider_providerId_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "user_oauth_providers_provider_providerId_key" ON public.user_oauth_providers USING btree (provider, "providerId");


--
-- Name: user_oauth_providers_userId_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX "user_oauth_providers_userId_idx" ON public.user_oauth_providers USING btree ("userId");


--
-- Name: user_oauth_providers_userId_provider_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX "user_oauth_providers_userId_provider_key" ON public.user_oauth_providers USING btree ("userId", provider);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_status_idx; Type: INDEX; Schema: public; Owner: cykruit_admin
--

CREATE INDEX users_status_idx ON public.users USING btree (status);


--
-- Name: admin_audit_logs admin_audit_logs_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_sessions admin_sessions_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT "admin_sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_notes application_notes_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.application_notes
    ADD CONSTRAINT "application_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_status_history application_status_history_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.application_status_history
    ADD CONSTRAINT "application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications applications_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications applications_resumeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT "applications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES public.resumes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: applications applications_seekerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT "applications_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_benefits company_benefits_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_benefits
    ADD CONSTRAINT "company_benefits_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_media company_media_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_media
    ADD CONSTRAINT "company_media_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_profile_views company_profile_views_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_profile_views
    ADD CONSTRAINT "company_profile_views_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: company_profile_views company_profile_views_viewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.company_profile_views
    ADD CONSTRAINT "company_profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "conversations_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ctf_profiles ctf_profiles_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.ctf_profiles
    ADD CONSTRAINT "ctf_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: data_rights_requests data_rights_requests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.data_rights_requests
    ADD CONSTRAINT "data_rights_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: education education_instituteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT "education_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: education education_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.education
    ADD CONSTRAINT "education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employer_settings employer_settings_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employer_settings
    ADD CONSTRAINT "employer_settings_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employer_verifications employer_verifications_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employer_verifications
    ADD CONSTRAINT "employer_verifications_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employer_verifications employer_verifications_previousVerificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employer_verifications
    ADD CONSTRAINT "employer_verifications_previousVerificationId_fkey" FOREIGN KEY ("previousVerificationId") REFERENCES public.employer_verifications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employer_verifications employer_verifications_reviewedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employer_verifications
    ADD CONSTRAINT "employer_verifications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employers employers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT "employers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: experiences experiences_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT "experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_certifications job_certifications_certificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_certifications
    ADD CONSTRAINT "job_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES public.certifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_certifications job_certifications_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_certifications
    ADD CONSTRAINT "job_certifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_seeker_certifications job_seeker_certifications_certificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_certifications
    ADD CONSTRAINT "job_seeker_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES public.certifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_seeker_certifications job_seeker_certifications_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_certifications
    ADD CONSTRAINT "job_seeker_certifications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_seeker_profiles job_seeker_profiles_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_profiles
    ADD CONSTRAINT "job_seeker_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: job_seeker_profiles job_seeker_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_profiles
    ADD CONSTRAINT "job_seeker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_seeker_settings job_seeker_settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_settings
    ADD CONSTRAINT "job_seeker_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_seeker_skills job_seeker_skills_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_skills
    ADD CONSTRAINT "job_seeker_skills_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_seeker_skills job_seeker_skills_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_seeker_skills
    ADD CONSTRAINT "job_seeker_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public.skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_skills job_skills_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_skills job_skills_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public.skills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_views job_views_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_views
    ADD CONSTRAINT "job_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_views job_views_viewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.job_views
    ADD CONSTRAINT "job_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jobs jobs_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jobs jobs_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: jobs jobs_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT "jobs_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: location_preferences location_preferences_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.location_preferences
    ADD CONSTRAINT "location_preferences_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: location_preferences location_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.location_preferences
    ADD CONSTRAINT "location_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_replyToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messages messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: office_locations office_locations_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.office_locations
    ADD CONSTRAINT "office_locations_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profile_views profile_views_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT "profile_views_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: profile_views profile_views_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT "profile_views_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profile_views profile_views_viewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT "profile_views_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: projects projects_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT "projects_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resumes resumes_profileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT "resumes_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES public.job_seeker_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saved_jobs saved_jobs_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public.jobs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saved_jobs saved_jobs_seekerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT "saved_jobs_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skills skills_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.skill_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: team_members team_members_employerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT "team_members_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES public.employers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tokens tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trainer_certifications trainer_certifications_certificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.trainer_certifications
    ADD CONSTRAINT "trainer_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES public.certifications(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: trainer_certifications trainer_certifications_trainerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.trainer_certifications
    ADD CONSTRAINT "trainer_certifications_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES public.trainers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_consents user_consents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_oauth_providers user_oauth_providers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cykruit_admin
--

ALTER TABLE ONLY public.user_oauth_providers
    ADD CONSTRAINT "user_oauth_providers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict cTlIymQxDHEM9muYt1qo1L3mBlVuWGSLMF66lmCfohKHYggTfeUNMUGvqTAvawh

