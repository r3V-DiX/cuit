"use strict";
// libs/auth-core/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareFingerprints = exports.generateDeviceFingerprint = exports.resolveSessionExpiry = exports.hashToken = exports.generateRawToken = exports.SESSION_VALIDATOR = exports.IS_OPTIONAL_AUTH_KEY = exports.OptionalAuth = exports.ROLES_KEY = exports.Roles = exports.IS_PUBLIC_KEY = exports.Public = exports.CurrentUser = exports.CsrfGuard = exports.RolesGuard = exports.OptionalAuthGuard = exports.AuthGuard = exports.AuthCoreModule = void 0;
var auth_core_module_1 = require("./auth-core.module");
Object.defineProperty(exports, "AuthCoreModule", { enumerable: true, get: function () { return auth_core_module_1.AuthCoreModule; } });
// Guards
var auth_guard_1 = require("./guards/auth.guard");
Object.defineProperty(exports, "AuthGuard", { enumerable: true, get: function () { return auth_guard_1.AuthGuard; } });
var optional_auth_guard_1 = require("./guards/optional-auth.guard");
Object.defineProperty(exports, "OptionalAuthGuard", { enumerable: true, get: function () { return optional_auth_guard_1.OptionalAuthGuard; } });
var roles_guard_1 = require("./guards/roles.guard");
Object.defineProperty(exports, "RolesGuard", { enumerable: true, get: function () { return roles_guard_1.RolesGuard; } });
var csrf_guard_1 = require("./guards/csrf.guard");
Object.defineProperty(exports, "CsrfGuard", { enumerable: true, get: function () { return csrf_guard_1.CsrfGuard; } });
// Decorators
var index_1 = require("./decorators/index");
Object.defineProperty(exports, "CurrentUser", { enumerable: true, get: function () { return index_1.CurrentUser; } });
Object.defineProperty(exports, "Public", { enumerable: true, get: function () { return index_1.Public; } });
Object.defineProperty(exports, "IS_PUBLIC_KEY", { enumerable: true, get: function () { return index_1.IS_PUBLIC_KEY; } });
Object.defineProperty(exports, "Roles", { enumerable: true, get: function () { return index_1.Roles; } });
Object.defineProperty(exports, "ROLES_KEY", { enumerable: true, get: function () { return index_1.ROLES_KEY; } });
Object.defineProperty(exports, "OptionalAuth", { enumerable: true, get: function () { return index_1.OptionalAuth; } });
Object.defineProperty(exports, "IS_OPTIONAL_AUTH_KEY", { enumerable: true, get: function () { return index_1.IS_OPTIONAL_AUTH_KEY; } });
// Session validator interface
var session_validator_interface_1 = require("./session-validator.interface");
Object.defineProperty(exports, "SESSION_VALIDATOR", { enumerable: true, get: function () { return session_validator_interface_1.SESSION_VALIDATOR; } });
// ✅ Shared utils — importable by any service via @cykruit/auth-core
var session_utils_1 = require("./utils/session.utils");
Object.defineProperty(exports, "generateRawToken", { enumerable: true, get: function () { return session_utils_1.generateRawToken; } });
Object.defineProperty(exports, "hashToken", { enumerable: true, get: function () { return session_utils_1.hashToken; } });
Object.defineProperty(exports, "resolveSessionExpiry", { enumerable: true, get: function () { return session_utils_1.resolveSessionExpiry; } });
var device_fingerprint_util_1 = require("./utils/device-fingerprint.util");
Object.defineProperty(exports, "generateDeviceFingerprint", { enumerable: true, get: function () { return device_fingerprint_util_1.generateDeviceFingerprint; } });
Object.defineProperty(exports, "compareFingerprints", { enumerable: true, get: function () { return device_fingerprint_util_1.compareFingerprints; } });
