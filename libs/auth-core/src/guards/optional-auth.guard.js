"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalAuthGuard = void 0;
// libs/auth-core/guards/optional-auth.guard.ts
const common_1 = require("@nestjs/common");
const session_validator_interface_1 = require("../session-validator.interface");
const config_1 = require("@cykruit/config");
let OptionalAuthGuard = class OptionalAuthGuard {
    constructor(sessionValidator) {
        this.sessionValidator = sessionValidator;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const sessionToken = request.cookies[config_1.CookieConfig.COOKIE_NAMES.SESSION];
        if (!sessionToken) {
            request['user'] = null;
            return true;
        }
        try {
            const { user } = await this.sessionValidator.validateSession(sessionToken);
            request['user'] = user || null;
        }
        catch {
            request['user'] = null;
        }
        return true;
    }
};
exports.OptionalAuthGuard = OptionalAuthGuard;
exports.OptionalAuthGuard = OptionalAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(session_validator_interface_1.SESSION_VALIDATOR)),
    __metadata("design:paramtypes", [Object])
], OptionalAuthGuard);
