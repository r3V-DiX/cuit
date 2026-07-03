"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalAuth = exports.IS_OPTIONAL_AUTH_KEY = exports.Roles = exports.ROLES_KEY = exports.Public = exports.IS_PUBLIC_KEY = exports.CurrentUser = void 0;
// libs/auth-core/decorators/index.ts
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
// ─── @CurrentUser ────────────────────────────────────────────────────────────
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const user = ctx.switchToHttp().getRequest().user;
    return data ? user?.[data] : user;
});
// ─── @Public ─────────────────────────────────────────────────────────────────
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_2.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
// ─── @Roles ──────────────────────────────────────────────────────────────────
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_2.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
// ─── @OptionalAuth ────────────────────────────────────────────────────────────
exports.IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
const OptionalAuth = () => (0, common_2.SetMetadata)(exports.IS_OPTIONAL_AUTH_KEY, true);
exports.OptionalAuth = OptionalAuth;
