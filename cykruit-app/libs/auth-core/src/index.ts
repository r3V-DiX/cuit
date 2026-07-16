// libs/auth-core/src/index.ts

export { AuthCoreModule } from "./auth-core.module";

// Guards
export { AuthGuard } from "./guards/auth.guard";
export { OptionalAuthGuard } from "./guards/optional-auth.guard";
export { RolesGuard } from "./guards/roles.guard";
export { CsrfGuard } from "./guards/csrf.guard";

// Shared session validator — canonical ISessionValidator for every service
export { SharedSessionValidator } from "./shared-session-validator.service";

// Decorators
export {
  CurrentUser,
  Public,
  IS_PUBLIC_KEY,
  Roles,
  ROLES_KEY,
  OptionalAuth,
  IS_OPTIONAL_AUTH_KEY,
} from "./decorators/index";

// Session validator interface
export {
  SESSION_VALIDATOR,
  ISessionValidator,
  ISessionValidationResult,
} from "./session-validator.interface";

// ✅ Shared utils — importable by any service via @cykruit/auth-core
export {
  generateRawToken,
  hashToken,
  resolveSessionExpiry,
} from "./utils/session.utils";

export {
  generateDeviceFingerprint,
  compareFingerprints,
} from "./utils/device-fingerprint.util";

export type { DeviceFingerprint } from "./utils/device-fingerprint.util";
