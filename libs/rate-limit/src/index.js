"use strict";
// libs/rate-limit/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthRateLimit = exports.RefreshTokenRateLimit = exports.VerifyEmailRateLimit = exports.ResendVerificationRateLimit = exports.ForgotPasswordRateLimit = exports.RegisterRateLimit = exports.LoginRateLimit = exports.SkipRateLimit = exports.RateLimit = exports.RateLimitGuard = exports.RateLimitModule = void 0;
var rate_limit_module_1 = require("./rate-limit.module");
Object.defineProperty(exports, "RateLimitModule", { enumerable: true, get: function () { return rate_limit_module_1.RateLimitModule; } });
var rate_limit_guard_1 = require("./rate-limit.guard");
Object.defineProperty(exports, "RateLimitGuard", { enumerable: true, get: function () { return rate_limit_guard_1.RateLimitGuard; } });
var rate_limit_decorator_1 = require("./rate-limit.decorator");
Object.defineProperty(exports, "RateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.RateLimit; } });
Object.defineProperty(exports, "SkipRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.SkipRateLimit; } });
Object.defineProperty(exports, "LoginRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.LoginRateLimit; } });
Object.defineProperty(exports, "RegisterRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.RegisterRateLimit; } });
Object.defineProperty(exports, "ForgotPasswordRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.ForgotPasswordRateLimit; } });
Object.defineProperty(exports, "ResendVerificationRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.ResendVerificationRateLimit; } });
Object.defineProperty(exports, "VerifyEmailRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.VerifyEmailRateLimit; } });
Object.defineProperty(exports, "RefreshTokenRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.RefreshTokenRateLimit; } });
Object.defineProperty(exports, "OAuthRateLimit", { enumerable: true, get: function () { return rate_limit_decorator_1.OAuthRateLimit; } });
