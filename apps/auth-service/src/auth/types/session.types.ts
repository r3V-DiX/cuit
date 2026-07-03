// apps/auth-service/src/auth/types/session.types.ts

// Mirror schema enums locally so service layer doesn't import from @prisma/client everywhere
export enum DeviceType {
  WEB = "WEB",
  MOBILE = "MOBILE",
  TABLET = "TABLET",
  DESKTOP = "DESKTOP",
  API = "API",
}

export enum SessionType {
  COOKIE = "COOKIE",
  JWT = "JWT",
}

// Device metadata sent by clients on login
export interface DeviceInfo {
  deviceType?: DeviceType;
  deviceName?: string; // "iPhone 14 Pro", "Chrome on Windows"
  deviceModel?: string; // "iPhone15,2", "SM-G998B"
  platform?: string; // "ios" | "android" | "web"
  appVersion?: string; // "1.4.2"
  pushToken?: string; // FCM / APNs
}

// Returned by GET /auth/sessions
export interface SessionListItem {
  id: string;
  deviceType: DeviceType;
  sessionType: SessionType;
  deviceName: string | null;
  platform: string | null;
  appVersion: string | null;
  ipAddress: string | null;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

// Returned by POST /auth/mobile/login
export interface MobileLoginResult {
  accessToken: string; // JWT, 15 min
  refreshToken: string; // Opaque, 30 days — store in Keychain/EncryptedSharedPrefs
  expiresIn: number; // 900 (seconds)
  tokenType: "Bearer";
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    profileImage: string | null;
  };
}

// Returned by POST /auth/mobile/refresh
export interface TokenRefreshResult {
  accessToken: string;
  expiresIn: number; // 900
  tokenType: "Bearer";
}
