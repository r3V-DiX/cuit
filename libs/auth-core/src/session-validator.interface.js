"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_VALIDATOR = void 0;
/**
 * Abstract token for DI — AuthGuard depends on this interface.
 * apps/auth-service and apps/user-settings-service provide concrete implementations.
 */
exports.SESSION_VALIDATOR = Symbol("SESSION_VALIDATOR");
