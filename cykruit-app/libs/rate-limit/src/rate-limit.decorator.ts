// libs/rate-limit/src/rate-limit.decorator.ts

import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { getPolicyInt } from "@cykruit/policy-config";

/**
 * Apply a custom rate limit to a specific controller or route.
 *
 * @example
 * // 10 attempts per 15 minutes on the login route
 * @Throttle({ login: { ttl: 900_000, limit: 10 } })
 * @Post('login')
 */
export { Throttle as RateLimit, SkipThrottle as SkipRateLimit };

const isDev = process.env.NODE_ENV === "development";

// ── Auth route presets ────────────────────────────────────────
// Use these directly on controller methods — no magic numbers scattered in controllers

/** 10 attempts per 15 minutes — POST /auth/login */
export const LoginRateLimit = () =>
  Throttle({ login: { ttl: 15 * 60_000, limit: isDev ? 10000 : 10 } });

/** 5 registrations per hour per IP */
export const RegisterRateLimit = () =>
  Throttle({ register: { ttl: 60 * 60_000, limit: isDev ? 10000 : 5 } });

/** 3 forgot-password requests per hour — prevents user enumeration spam */
export const ForgotPasswordRateLimit =
  () => (target: any, key: string, descriptor: PropertyDescriptor) => {
    SkipThrottle({ global: true })(target, key, descriptor);
    Throttle({
      forgot_password: { ttl: 60 * 60_000, limit: isDev ? 10000 : 3 },
    })(target, key, descriptor);
  };

/** 3 resend-verification emails per hour */
export const ResendVerificationRateLimit = () =>
  Throttle({
    resend_verification: { ttl: 60 * 60_000, limit: isDev ? 10000 : 3 },
  });

/** 10 verify-email attempts per hour */
export const VerifyEmailRateLimit = () =>
  Throttle({ verify_email: { ttl: 60 * 60_000, limit: isDev ? 10000 : 10 } });

/** 20 refresh-token calls per minute — apps refresh proactively */
export const RefreshTokenRateLimit = () =>
  Throttle({ refresh_token: { ttl: 60_000, limit: isDev ? 10000 : 20 } });

/** 20 OAuth callbacks per minute */
export const OAuthRateLimit = () =>
  Throttle({ oauth: { ttl: 60_000, limit: isDev ? 10000 : 20 } });

/**
 * OTP requests per window per IP — live-editable via the admin Policies page
 * (PolicyConfig keys: otp_request_limit, otp_request_window_minutes).
 * Falls back to 30 req / 10 min if the row is missing (e.g. before seeding).
 */
export const RequestOtpRateLimit = () =>
  Throttle({
    request_otp: {
      ttl: async () =>
        isDev ? 10 * 60_000 : (await getPolicyInt("otp_request_window_minutes", 10)) * 60_000,
      limit: async () => (isDev ? 10000 : getPolicyInt("otp_request_limit", 30)),
    },
  });

/**
 * OTP verify attempts per window per IP — live-editable via the admin Policies
 * page (PolicyConfig key: otp_verify_limit, same window as request_otp).
 * Falls back to 50 req / 10 min if the row is missing.
 */
export const VerifyOtpRateLimit = () =>
  Throttle({
    verify_otp: {
      ttl: async () =>
        isDev ? 10 * 60_000 : (await getPolicyInt("otp_request_window_minutes", 10)) * 60_000,
      limit: async () => (isDev ? 10000 : getPolicyInt("otp_verify_limit", 50)),
    },
  });

/**
 * Contact form submissions per hour per IP — live-editable via the admin
 * Policies page (PolicyConfig key: contact_form_rate_limit). Falls back to 3/hour.
 */
export const ContactFormRateLimit = () =>
  Throttle({
    global: {
      ttl: 60 * 60_000,
      limit: async () => (isDev ? 10000 : getPolicyInt("contact_form_rate_limit", 3)),
    },
  });

/**
 * Public job search requests per minute per IP — live-editable via the admin
 * Policies page (PolicyConfig key: public_search_rate_limit). Falls back to 60/min.
 */
export const PublicSearchRateLimit = () =>
  Throttle({
    public_search: {
      ttl: 60_000,
      limit: async () => (isDev ? 10000 : getPolicyInt("public_search_rate_limit", 60)),
    },
  });
