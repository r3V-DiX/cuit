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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfGuard = void 0;
// libs/auth-core/src/guards/csrf.guard.ts
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const decorators_1 = require("../decorators");
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_HEADER = "x-csrf-token";
const TOKEN_SEPARATOR = ".";
let CsrfGuard = class CsrfGuard {
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
        const jwtSecret = this.configService.get("JWT_SECRET");
        if (!jwtSecret)
            throw new Error("JWT_SECRET must be set for CSRF protection");
        this.secret = (0, crypto_1.createHmac)("sha256", jwtSecret)
            .update("csrf-token-v1")
            .digest("hex");
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (SAFE_METHODS.has(request.method))
            return true;
        const isPublic = this.reflector.getAllAndOverride(decorators_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const token = request.headers[CSRF_HEADER];
        if (!token) {
            throw new common_1.ForbiddenException({
                code: "CSRF_TOKEN_MISSING",
                message: "CSRF token is required for this request.",
            });
        }
        if (!this.verifyToken(token)) {
            throw new common_1.ForbiddenException({
                code: "CSRF_TOKEN_INVALID",
                message: "CSRF token is invalid or has expired.",
            });
        }
        return true;
    }
    generateToken() {
        const nonce = (0, crypto_1.randomBytes)(32).toString("hex");
        const timestamp = Math.floor(Date.now() / 1000).toString(36);
        const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
        const sig = (0, crypto_1.createHmac)("sha256", this.secret).update(payload).digest("hex");
        return `${payload}${TOKEN_SEPARATOR}${sig}`;
    }
    verifyToken(token) {
        if (!token || typeof token !== "string")
            return false;
        const parts = token.split(TOKEN_SEPARATOR);
        if (parts.length !== 3)
            return false;
        const [nonce, timestamp, sig] = parts;
        if (!nonce || !timestamp || !sig)
            return false;
        const issuedAt = parseInt(timestamp, 36);
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (nowSeconds - issuedAt > 24 * 60 * 60)
            return false;
        const payload = `${nonce}${TOKEN_SEPARATOR}${timestamp}`;
        const expectedSig = (0, crypto_1.createHmac)("sha256", this.secret)
            .update(payload)
            .digest("hex");
        try {
            return (0, crypto_1.timingSafeEqual)(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
        }
        catch {
            return false;
        }
    }
};
exports.CsrfGuard = CsrfGuard;
exports.CsrfGuard = CsrfGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], CsrfGuard);
