"use strict";
// libs/audit/src/audit.types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    // ── Login ─────────────────────────────────────────────────────
    AuditAction["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditAction["LOGIN_FAILURE"] = "LOGIN_FAILURE";
    AuditAction["LOGIN_LOCKED"] = "LOGIN_LOCKED";
    // ── Logout ────────────────────────────────────────────────────
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["LOGOUT_ALL"] = "LOGOUT_ALL";
    // ── Registration ──────────────────────────────────────────────
    AuditAction["REGISTER"] = "REGISTER";
    // ── Email verification ────────────────────────────────────────
    AuditAction["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    AuditAction["EMAIL_VERIFICATION_RESENT"] = "EMAIL_VERIFICATION_RESENT";
    // ── Password ──────────────────────────────────────────────────
    AuditAction["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    AuditAction["PASSWORD_RESET_REQUESTED"] = "PASSWORD_RESET_REQUESTED";
    AuditAction["PASSWORD_RESET_COMPLETED"] = "PASSWORD_RESET_COMPLETED";
    // ── Sessions ──────────────────────────────────────────────────
    AuditAction["SESSION_REVOKED"] = "SESSION_REVOKED";
    AuditAction["SESSION_REVOKED_ALL"] = "SESSION_REVOKED_ALL";
    AuditAction["SESSION_ROTATED"] = "SESSION_ROTATED";
    AuditAction["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    // ── OAuth ─────────────────────────────────────────────────────
    AuditAction["OAUTH_LOGIN"] = "OAUTH_LOGIN";
    AuditAction["OAUTH_ACCOUNT_LINKED"] = "OAUTH_ACCOUNT_LINKED";
    // ── Account ───────────────────────────────────────────────────
    AuditAction["ACCOUNT_DELETED"] = "ACCOUNT_DELETED";
    AuditAction["ACCOUNT_DEACTIVATED"] = "ACCOUNT_DEACTIVATED";
    AuditAction["ACCOUNT_DELETION_CANCELLED"] = "ACCOUNT_DELETION_CANCELLED";
    // ── Mobile ───────────────────────────────────────────────────
    AuditAction["MOBILE_LOGIN"] = "MOBILE_LOGIN";
    AuditAction["MOBILE_TOKEN_REFRESHED"] = "MOBILE_TOKEN_REFRESHED";
    AuditAction["MOBILE_LOGOUT"] = "MOBILE_LOGOUT";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
