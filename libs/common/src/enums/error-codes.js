"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodeDescriptions = exports.ErrorCodes = void 0;
exports.getErrorDescription = getErrorDescription;
exports.isValidErrorCode = isValidErrorCode;
// libs/common/enums/error-codes.ts
const error_codes_general_1 = require("./error-codes.general");
const error_codes_auth_1 = require("./error-codes.auth");
const error_codes_domain_1 = require("./error-codes.domain");
// Re-export all domain enums for individual imports
__exportStar(require("./error-codes.general"), exports);
__exportStar(require("./error-codes.auth"), exports);
__exportStar(require("./error-codes.domain"), exports);
// Combined object for convenience
exports.ErrorCodes = {
    ...error_codes_general_1.GeneralErrorCodes,
    ...error_codes_general_1.DatabaseErrorCodes,
    ...error_codes_general_1.ValidationErrorCodes,
    ...error_codes_general_1.ExternalServiceErrorCodes,
    ...error_codes_auth_1.AuthErrorCodes,
    ...error_codes_auth_1.OAuthErrorCodes,
    ...error_codes_auth_1.RateLimitErrorCodes,
    ...error_codes_domain_1.UserErrorCodes,
    ...error_codes_domain_1.UploadErrorCodes,
    ...error_codes_domain_1.JobErrorCodes,
    ...error_codes_domain_1.ApplicationErrorCodes,
    ...error_codes_domain_1.VerificationErrorCodes,
    ...error_codes_domain_1.LocationErrorCodes,
    ...error_codes_domain_1.NotificationErrorCodes,
    ...error_codes_domain_1.MessageErrorCodes,
    ...error_codes_domain_1.AIErrorCodes,
    ...error_codes_domain_1.PaymentErrorCodes,
    ...error_codes_domain_1.SavedJobErrorCodes,
    ...error_codes_domain_1.PublicProfileErrorCodes,
    ...error_codes_domain_1.CompanyErrorCodes,
    ...error_codes_domain_1.SettingsErrorCodes,
    ...error_codes_domain_1.LocationPreferenceErrorCodes,
};
// Helper functions
function getErrorDescription(code) {
    return exports.ErrorCodeDescriptions[code] || 'An error occurred';
}
function isValidErrorCode(code) {
    return Object.values(exports.ErrorCodes).includes(code);
}
exports.ErrorCodeDescriptions = {
    [error_codes_auth_1.AuthErrorCodes.INVALID_CREDENTIALS]: 'The email or password provided is incorrect',
    [error_codes_auth_1.AuthErrorCodes.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists',
    [error_codes_auth_1.AuthErrorCodes.EMAIL_NOT_VERIFIED]: 'Please verify your email before logging in',
    [error_codes_auth_1.AuthErrorCodes.EMAIL_ALREADY_VERIFIED]: 'Your email is already verified',
    [error_codes_auth_1.AuthErrorCodes.PASSWORD_MISMATCH]: 'Passwords do not match',
    [error_codes_auth_1.AuthErrorCodes.INVALID_TOKEN]: 'Invalid or malformed token',
    [error_codes_auth_1.AuthErrorCodes.TOKEN_EXPIRED]: 'Token has expired',
    [error_codes_auth_1.AuthErrorCodes.TOKEN_ALREADY_USED]: 'Token has already been used',
    [error_codes_auth_1.AuthErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please log in again',
    [error_codes_auth_1.AuthErrorCodes.ACCOUNT_SUSPENDED]: 'Your account has been suspended. Contact support',
    [error_codes_domain_1.UserErrorCodes.USER_NOT_FOUND]: 'User account not found',
    [error_codes_domain_1.UserErrorCodes.PROFILE_NOT_FOUND]: 'User profile not found',
    [error_codes_domain_1.UserErrorCodes.PROFILE_INCOMPLETE]: 'Please complete your profile to continue',
    [error_codes_domain_1.UserErrorCodes.PROFILE_NOT_CREATED]: 'Profile has not been created yet',
    [error_codes_domain_1.UploadErrorCodes.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit',
    [error_codes_domain_1.UploadErrorCodes.INVALID_FILE_TYPE]: 'File type not supported',
    [error_codes_domain_1.JobErrorCodes.JOB_NOT_FOUND]: 'Job posting not found',
    [error_codes_domain_1.JobErrorCodes.JOB_ALREADY_CLOSED]: 'This job posting is already closed',
    [error_codes_domain_1.JobErrorCodes.COMPANY_NOT_VERIFIED]: 'Your company must be verified to post jobs',
    [error_codes_domain_1.ApplicationErrorCodes.APPLICATION_NOT_FOUND]: 'Application not found',
    [error_codes_domain_1.ApplicationErrorCodes.ALREADY_APPLIED]: 'You have already applied to this job',
    [error_codes_domain_1.ApplicationErrorCodes.JOB_EXPIRED]: 'This job posting has expired',
    [error_codes_domain_1.ApplicationErrorCodes.PROFILE_COMPLETION_TOO_LOW]: 'Complete your profile to at least 70% to apply',
    [error_codes_domain_1.ApplicationErrorCodes.ALREADY_WITHDRAWN]: 'This application has already been withdrawn',
    [error_codes_domain_1.ApplicationErrorCodes.CANNOT_WITHDRAW_REJECTED]: 'Cannot withdraw a rejected application',
    [error_codes_domain_1.ApplicationErrorCodes.NOT_YOUR_APPLICATION]: 'This application does not belong to you',
    [error_codes_domain_1.ApplicationErrorCodes.NOT_YOUR_JOB]: 'This job does not belong to your company',
    [error_codes_domain_1.LocationErrorCodes.LOCATION_NOT_FOUND]: 'Location not found',
    [error_codes_domain_1.NotificationErrorCodes.NOTIFICATION_FAILED]: 'Failed to send notification',
    [error_codes_general_1.ExternalServiceErrorCodes.EMAIL_SEND_FAILED]: 'Failed to send email. Please try again',
    [error_codes_domain_1.SavedJobErrorCodes.JOB_ALREADY_SAVED]: 'This job is already saved',
    [error_codes_domain_1.SavedJobErrorCodes.CANNOT_SAVE_OWN_JOB]: 'You cannot save your own job',
    [error_codes_domain_1.CompanyErrorCodes.COMPANY_NOT_FOUND]: 'Company not found',
    [error_codes_domain_1.VerificationErrorCodes.ALREADY_VERIFIED]: 'Your company is already verified',
    [error_codes_domain_1.VerificationErrorCodes.VERIFICATION_PENDING]: 'You already have a pending verification request',
    [error_codes_domain_1.SettingsErrorCodes.INVALID_PASSWORD]: 'Incorrect password provided',
};
