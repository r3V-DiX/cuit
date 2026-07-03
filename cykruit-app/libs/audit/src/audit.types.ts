// libs/audit/src/audit.types.ts

export enum AuditAction {
    // ── Login ─────────────────────────────────────────────────────
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    LOGIN_LOCKED = 'LOGIN_LOCKED',

    // ── Logout ────────────────────────────────────────────────────
    LOGOUT = 'LOGOUT',
    LOGOUT_ALL = 'LOGOUT_ALL',

    // ── Registration ──────────────────────────────────────────────
    REGISTER = 'REGISTER',

    // ── Email verification ────────────────────────────────────────
    EMAIL_VERIFIED = 'EMAIL_VERIFIED',
    EMAIL_VERIFICATION_RESENT = 'EMAIL_VERIFICATION_RESENT',

    // ── Password ──────────────────────────────────────────────────
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
    PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',

    // ── Sessions ──────────────────────────────────────────────────
    SESSION_REVOKED = 'SESSION_REVOKED',
    SESSION_REVOKED_ALL = 'SESSION_REVOKED_ALL',
    SESSION_ROTATED = 'SESSION_ROTATED',
    SESSION_EXPIRED = 'SESSION_EXPIRED',

    // ── OAuth ─────────────────────────────────────────────────────
    OAUTH_LOGIN = 'OAUTH_LOGIN',
    OAUTH_ACCOUNT_LINKED = 'OAUTH_ACCOUNT_LINKED',

    // ── Account ───────────────────────────────────────────────────
    ACCOUNT_DELETED = 'ACCOUNT_DELETED',
    ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',           // ✅ NEW
    ACCOUNT_DELETION_CANCELLED = 'ACCOUNT_DELETION_CANCELLED', // ✅ NEW

    // ── Mobile ───────────────────────────────────────────────────
    MOBILE_LOGIN = 'MOBILE_LOGIN',
    MOBILE_TOKEN_REFRESHED = 'MOBILE_TOKEN_REFRESHED',
    MOBILE_LOGOUT = 'MOBILE_LOGOUT',
}

export type AuditStatus = 'SUCCESS' | 'FAILURE';

export interface AuditRequestContext {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
}

export interface AuditLogEntry {
    action: AuditAction;
    status: AuditStatus;
    userId?: string;
    req?: AuditRequestContext;
    metadata?: Record<string, any>;
}