"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthCoreModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCoreModule = void 0;
// libs/auth-core/src/auth-core.module.ts
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const auth_guard_1 = require("./guards/auth.guard");
const optional_auth_guard_1 = require("./guards/optional-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const csrf_guard_1 = require("./guards/csrf.guard");
const session_validator_interface_1 = require("./session-validator.interface");
let AuthCoreModule = AuthCoreModule_1 = class AuthCoreModule {
    static forRoot(options) {
        const csrfProviders = options.enableCsrf
            ? [
                csrf_guard_1.CsrfGuard,
                {
                    provide: core_1.APP_GUARD,
                    useClass: csrf_guard_1.CsrfGuard,
                },
            ]
            : [
                // Always provide CsrfGuard so it can be injected
                // (e.g. AuthController needs it to call generateToken())
                // but don't register as APP_GUARD if enableCsrf is false
                csrf_guard_1.CsrfGuard,
            ];
        return {
            module: AuthCoreModule_1,
            imports: [config_1.ConfigModule, ...(options.imports || [])],
            providers: [
                {
                    provide: session_validator_interface_1.SESSION_VALIDATOR,
                    useClass: options.sessionValidatorClass,
                },
                auth_guard_1.AuthGuard,
                optional_auth_guard_1.OptionalAuthGuard,
                roles_guard_1.RolesGuard,
                ...csrfProviders,
            ],
            exports: [
                session_validator_interface_1.SESSION_VALIDATOR,
                auth_guard_1.AuthGuard,
                optional_auth_guard_1.OptionalAuthGuard,
                roles_guard_1.RolesGuard,
                csrf_guard_1.CsrfGuard, // always exported so controllers can inject it
            ],
        };
    }
};
exports.AuthCoreModule = AuthCoreModule;
exports.AuthCoreModule = AuthCoreModule = AuthCoreModule_1 = __decorate([
    (0, common_1.Module)({})
], AuthCoreModule);
