// libs/auth-core/decorators/index.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { User } from "@prisma/client";

// ─── @CurrentUser ────────────────────────────────────────────────────────────
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const user = ctx.switchToHttp().getRequest().user;
    return data ? user?.[data] : user;
  },
);

// ─── @Public ─────────────────────────────────────────────────────────────────
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ─── @Roles ──────────────────────────────────────────────────────────────────
export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ─── @OptionalAuth ────────────────────────────────────────────────────────────
export const IS_OPTIONAL_AUTH_KEY = "isOptionalAuth";
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
