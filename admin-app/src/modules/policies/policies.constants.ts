// admin-app/src/modules/policies/policies.constants.ts
// Single source of truth for seeded defaults — consumed by prisma/policy-seed.ts
// (initial insert) and PoliciesService (reset-to-default).

export interface PolicyDefault {
    key: string;
    value: string;
    type: 'integer' | 'boolean' | 'string';
    unit?: string;
    description: string;
}

export const POLICY_DEFAULTS: readonly PolicyDefault[] = [
    {
        key: 'otp_request_limit',
        value: '30',
        type: 'integer',
        unit: 'requests',
        description: 'Max OTP requests per window per email',
    },
    {
        key: 'otp_request_window_minutes',
        value: '10',
        type: 'integer',
        unit: 'minutes',
        description: 'Sliding window duration for OTP requests',
    },
    {
        key: 'otp_verify_limit',
        value: '50',
        type: 'integer',
        unit: 'requests',
        description: 'Max OTP verify attempts per window',
    },
    {
        key: 'otp_expiry_minutes',
        value: '10',
        type: 'integer',
        unit: 'minutes',
        description: 'OTP validity duration',
    },
    {
        key: 'otp_email_request_limit',
        value: '5',
        type: 'integer',
        unit: 'requests',
        description: 'Max OTP requests per email per window (separate from the per-IP throttle)',
    },
    {
        key: 'otp_email_request_window_minutes',
        value: '10',
        type: 'integer',
        unit: 'minutes',
        description: 'Sliding window for the per-email OTP request limit',
    },
    {
        key: 'account_deletion_grace_days',
        value: '30',
        type: 'integer',
        unit: 'days',
        description: 'Days before PENDING_DELETION is hard-deleted',
    },
    {
        key: 'session_max_lifetime_days',
        value: '30',
        type: 'integer',
        unit: 'days',
        description: 'Max age of a session cookie',
    },
    {
        key: 'max_active_sessions_per_user',
        value: '5',
        type: 'integer',
        unit: 'sessions',
        description: 'Concurrent sessions allowed per user',
    },
    {
        key: 'contact_form_rate_limit',
        value: '3',
        type: 'integer',
        unit: 'requests',
        description: 'Contact form submissions per hour per IP',
    },
    {
        key: 'public_search_rate_limit',
        value: '60',
        type: 'integer',
        unit: 'requests',
        description: 'Public job search requests per minute per IP',
    },
    {
        key: 'ai_resume_parse_limit',
        value: '5',
        type: 'integer',
        unit: 'requests',
        description: 'AI resume parse calls per hour per user',
    },
    {
        key: 'ai_jd_generate_limit',
        value: '20',
        type: 'integer',
        unit: 'requests',
        description: 'AI JD generate calls per day per employer',
    },
];
