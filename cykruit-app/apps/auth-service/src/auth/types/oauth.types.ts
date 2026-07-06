// apps/auth-service/src/auth/types/oauth.types.ts
// FIX [4]: Removed local re-export of OAuthProvider
// Previously this file did: export { OAuthProvider } from '@prisma/client'
// AND oauth-base.service.ts also imported OAuthProvider from '@prisma/client' directly
// Two import paths for the same type causes subtle mismatches in strict TS environments
// Now: all files import OAuthProvider directly from '@prisma/client' — single source of truth

import { UserRole } from "@prisma/client";
export { OAuthProvider } from "@prisma/client";

export interface OAuthUserData {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  provider: import("@prisma/client").OAuthProvider;
}

export interface OAuthState {
  role: UserRole;
  timestamp: number;
  nonce: string;
  redirectUrl?: string;
}

export interface OAuthLoginResult {
  user: any;
  sessionToken: string;
  isNewUser: boolean;
  linkedAccount: boolean;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}
