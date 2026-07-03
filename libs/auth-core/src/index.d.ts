export { AuthCoreModule } from "./auth-core.module";
export { AuthGuard } from "./guards/auth.guard";
export { OptionalAuthGuard } from "./guards/optional-auth.guard";
export { RolesGuard } from "./guards/roles.guard";
export { CsrfGuard } from "./guards/csrf.guard";
export {
  CurrentUser,
  Public,
  IS_PUBLIC_KEY,
  Roles,
  ROLES_KEY,
  OptionalAuth,
  IS_OPTIONAL_AUTH_KEY,
} from "./decorators/index";
export {
  SESSION_VALIDATOR,
  ISessionValidator,
  ISessionValidationResult,
} from "./session-validator.interface";
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
