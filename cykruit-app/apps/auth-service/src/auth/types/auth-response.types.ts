// apps/auth-service/src/auth/types/auth-response.types.ts

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SEEKER" | "EMPLOYER";
  isEmailVerified: boolean;
  profileImage?: string | null;
  phone?: string | null;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse extends BaseResponse {
  user: UserResponse;
}

export interface GetMeResponse {
  success: boolean;
  user: UserResponse;
}

export interface VerifyEmailResponse extends BaseResponse {
  user: UserResponse;
}

export type ResendVerificationResponse = BaseResponse;

export interface VerifyResetTokenResponse extends BaseResponse {
  valid: boolean;
}
