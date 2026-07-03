"use strict";
// libs/rate-limit/src/rate-limit.decorator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthRateLimit = exports.RefreshTokenRateLimit = exports.VerifyEmailRateLimit = exports.ResendVerificationRateLimit = exports.ForgotPasswordRateLimit = exports.RegisterRateLimit = exports.LoginRateLimit = exports.SkipRateLimit = exports.RateLimit = void 0;
const throttler_1 = require("@nestjs/throttler");
Object.defineProperty(exports, "RateLimit", { enumerable: true, get: function () { return throttler_1.Throttle; } });
Object.defineProperty(exports, "SkipRateLimit", { enumerable: true, get: function () { return throttler_1.SkipThrottle; } });
const isDev = process.env.NODE_ENV === "development";
// ── Auth route presets ────────────────────────────────────────
// Use these directly on controller methods — no magic numbers scattered in controllers
/** 10 attempts per 15 minutes — POST /auth/login */
const LoginRateLimit = () => (0, throttler_1.Throttle)({ login: { ttl: 15 * 60_000, limit: isDev ? 10000 : 10 } });
exports.LoginRateLimit = LoginRateLimit;
/** 5 registrations per hour per IP */
const RegisterRateLimit = () => (0, throttler_1.Throttle)({ register: { ttl: 60 * 60_000, limit: isDev ? 10000 : 5 } });
exports.RegisterRateLimit = RegisterRateLimit;
/** 3 forgot-password requests per hour — prevents user enumeration spam */
const ForgotPasswordRateLimit = () => (target, key, descriptor) => {
    (0, throttler_1.SkipThrottle)({ global: true })(target, key, descriptor);
    (0, throttler_1.Throttle)({
        forgot_password: { ttl: 60 * 60_000, limit: isDev ? 10000 : 3 },
    })(target, key, descriptor);
};
exports.ForgotPasswordRateLimit = ForgotPasswordRateLimit;
/** 3 resend-verification emails per hour */
const ResendVerificationRateLimit = () => (0, throttler_1.Throttle)({
    resend_verification: { ttl: 60 * 60_000, limit: isDev ? 10000 : 3 },
});
exports.ResendVerificationRateLimit = ResendVerificationRateLimit;
/** 10 verify-email attempts per hour */
const VerifyEmailRateLimit = () => (0, throttler_1.Throttle)({ verify_email: { ttl: 60 * 60_000, limit: isDev ? 10000 : 10 } });
exports.VerifyEmailRateLimit = VerifyEmailRateLimit;
/** 20 refresh-token calls per minute — apps refresh proactively */
const RefreshTokenRateLimit = () => (0, throttler_1.Throttle)({ refresh_token: { ttl: 60_000, limit: isDev ? 10000 : 20 } });
exports.RefreshTokenRateLimit = RefreshTokenRateLimit;
/** 20 OAuth callbacks per minute */
const OAuthRateLimit = () => (0, throttler_1.Throttle)({ oauth: { ttl: 60_000, limit: isDev ? 10000 : 20 } });
exports.OAuthRateLimit = OAuthRateLimit;
