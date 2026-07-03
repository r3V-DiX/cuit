// libs/common/enums/error-codes.ts
import {
  GeneralErrorCodes,
  DatabaseErrorCodes,
  ValidationErrorCodes,
  ExternalServiceErrorCodes,
} from "./error-codes.general";

import {
  AuthErrorCodes,
  OAuthErrorCodes,
  RateLimitErrorCodes,
} from "./error-codes.auth";

import {
  UserErrorCodes,
  UploadErrorCodes,
  JobErrorCodes,
  ApplicationErrorCodes,
  VerificationErrorCodes,
  LocationErrorCodes,
  NotificationErrorCodes,
  MessageErrorCodes,
  AIErrorCodes,
  PaymentErrorCodes,
  SavedJobErrorCodes,
  PublicProfileErrorCodes,
  CompanyErrorCodes,
  SettingsErrorCodes,
  LocationPreferenceErrorCodes,
} from "./error-codes.domain";

// Re-export all domain enums for individual imports
export * from "./error-codes.general";
export * from "./error-codes.auth";
export * from "./error-codes.domain";

// Combined object for convenience
export const ErrorCodes = {
  ...GeneralErrorCodes,
  ...DatabaseErrorCodes,
  ...ValidationErrorCodes,
  ...ExternalServiceErrorCodes,
  ...AuthErrorCodes,
  ...OAuthErrorCodes,
  ...RateLimitErrorCodes,
  ...UserErrorCodes,
  ...UploadErrorCodes,
  ...JobErrorCodes,
  ...ApplicationErrorCodes,
  ...VerificationErrorCodes,
  ...LocationErrorCodes,
  ...NotificationErrorCodes,
  ...MessageErrorCodes,
  ...AIErrorCodes,
  ...PaymentErrorCodes,
  ...SavedJobErrorCodes,
  ...PublicProfileErrorCodes,
  ...CompanyErrorCodes,
  ...SettingsErrorCodes,
  ...LocationPreferenceErrorCodes,
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Helper functions
export function getErrorDescription(code: string): string {
  return ErrorCodeDescriptions[code] || "An error occurred";
}

export function isValidErrorCode(code: string): boolean {
  return Object.values(ErrorCodes).includes(code as any);
}

export const ErrorCodeDescriptions: Record<string, string> = {
  [AuthErrorCodes.INVALID_CREDENTIALS]:
    "The email or password provided is incorrect",
  [AuthErrorCodes.EMAIL_ALREADY_EXISTS]:
    "An account with this email already exists",
  [AuthErrorCodes.EMAIL_NOT_VERIFIED]:
    "Please verify your email before logging in",
  [AuthErrorCodes.EMAIL_ALREADY_VERIFIED]: "Your email is already verified",
  [AuthErrorCodes.PASSWORD_MISMATCH]: "Passwords do not match",
  [AuthErrorCodes.INVALID_TOKEN]: "Invalid or malformed token",
  [AuthErrorCodes.TOKEN_EXPIRED]: "Token has expired",
  [AuthErrorCodes.TOKEN_ALREADY_USED]: "Token has already been used",
  [AuthErrorCodes.SESSION_EXPIRED]:
    "Your session has expired. Please log in again",
  [AuthErrorCodes.ACCOUNT_SUSPENDED]:
    "Your account has been suspended. Contact support",
  [UserErrorCodes.USER_NOT_FOUND]: "User account not found",
  [UserErrorCodes.PROFILE_NOT_FOUND]: "User profile not found",
  [UserErrorCodes.PROFILE_INCOMPLETE]:
    "Please complete your profile to continue",
  [UserErrorCodes.PROFILE_NOT_CREATED]: "Profile has not been created yet",
  [UploadErrorCodes.FILE_TOO_LARGE]:
    "File size exceeds the maximum allowed limit",
  [UploadErrorCodes.INVALID_FILE_TYPE]: "File type not supported",
  [JobErrorCodes.JOB_NOT_FOUND]: "Job posting not found",
  [JobErrorCodes.JOB_ALREADY_CLOSED]: "This job posting is already closed",
  [JobErrorCodes.COMPANY_NOT_VERIFIED]:
    "Your company must be verified to post jobs",
  [ApplicationErrorCodes.APPLICATION_NOT_FOUND]: "Application not found",
  [ApplicationErrorCodes.ALREADY_APPLIED]:
    "You have already applied to this job",
  [ApplicationErrorCodes.JOB_EXPIRED]: "This job posting has expired",
  [ApplicationErrorCodes.PROFILE_COMPLETION_TOO_LOW]:
    "Complete your profile to at least 70% to apply",
  [ApplicationErrorCodes.ALREADY_WITHDRAWN]:
    "This application has already been withdrawn",
  [ApplicationErrorCodes.CANNOT_WITHDRAW_REJECTED]:
    "Cannot withdraw a rejected application",
  [ApplicationErrorCodes.NOT_YOUR_APPLICATION]:
    "This application does not belong to you",
  [ApplicationErrorCodes.NOT_YOUR_JOB]:
    "This job does not belong to your company",
  [LocationErrorCodes.LOCATION_NOT_FOUND]: "Location not found",
  [NotificationErrorCodes.NOTIFICATION_FAILED]: "Failed to send notification",
  [ExternalServiceErrorCodes.EMAIL_SEND_FAILED]:
    "Failed to send email. Please try again",
  [SavedJobErrorCodes.JOB_ALREADY_SAVED]: "This job is already saved",
  [SavedJobErrorCodes.CANNOT_SAVE_OWN_JOB]: "You cannot save your own job",
  [CompanyErrorCodes.COMPANY_NOT_FOUND]: "Company not found",
  [VerificationErrorCodes.ALREADY_VERIFIED]: "Your company is already verified",
  [VerificationErrorCodes.VERIFICATION_PENDING]:
    "You already have a pending verification request",
  [SettingsErrorCodes.INVALID_PASSWORD]: "Incorrect password provided",
};
