import { Throttle, SkipThrottle } from "@nestjs/throttler";
/**
 * Apply a custom rate limit to a specific controller or route.
 *
 * @example
 * // 10 attempts per 15 minutes on the login route
 * @Throttle({ login: { ttl: 900_000, limit: 10 } })
 * @Post('login')
 */
export { Throttle as RateLimit, SkipThrottle as SkipRateLimit };
/** 10 attempts per 15 minutes — POST /auth/login */
export declare const LoginRateLimit: () => MethodDecorator & ClassDecorator;
/** 5 registrations per hour per IP */
export declare const RegisterRateLimit: () => MethodDecorator & ClassDecorator;
/** 3 forgot-password requests per hour — prevents user enumeration spam */
export declare const ForgotPasswordRateLimit: () => (
  target: any,
  key: string,
  descriptor: PropertyDescriptor,
) => void;
/** 3 resend-verification emails per hour */
export declare const ResendVerificationRateLimit: () => MethodDecorator &
  ClassDecorator;
/** 10 verify-email attempts per hour */
export declare const VerifyEmailRateLimit: () => MethodDecorator &
  ClassDecorator;
/** 20 refresh-token calls per minute — apps refresh proactively */
export declare const RefreshTokenRateLimit: () => MethodDecorator &
  ClassDecorator;
/** 20 OAuth callbacks per minute */
export declare const OAuthRateLimit: () => MethodDecorator & ClassDecorator;
