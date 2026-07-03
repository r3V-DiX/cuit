import { UserRole } from "@prisma/client";
export declare const CurrentUser: (
  ...dataOrPipes: (
    | "role"
    | "email"
    | "id"
    | "createdAt"
    | "updatedAt"
    | "profileImage"
    | "firstName"
    | "lastName"
    | "password"
    | "phone"
    | "isEmailVerified"
    | "emailVerifiedAt"
    | "status"
    | "deactivatedAt"
    | "deletionScheduledAt"
    | "lastLogin"
    | "lastLoginIp"
    | "failedLoginAttempts"
    | "lockedUntil"
    | "lastFailedLoginAt"
    | "lastFailedLoginIp"
    | import("@nestjs/common").PipeTransform<any, any>
    | import("@nestjs/common").Type<
        import("@nestjs/common").PipeTransform<any, any>
      >
  )[]
) => ParameterDecorator;
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const ROLES_KEY = "roles";
export declare const Roles: (
  ...roles: UserRole[]
) => import("@nestjs/common").CustomDecorator<string>;
export declare const IS_OPTIONAL_AUTH_KEY = "isOptionalAuth";
export declare const OptionalAuth: () => import("@nestjs/common").CustomDecorator<string>;
