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
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
let RateLimitGuard = class RateLimitGuard extends throttler_1.ThrottlerGuard {
    constructor(options, storageService, reflector) {
        super(options, storageService, reflector);
        const raw = process.env.TRUSTED_PROXY_COUNT ?? "0";
        const parsed = parseInt(raw, 10);
        this.trustedProxyCount = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }
    // ✅ Override shouldSkip — reads SkipThrottle metadata correctly for named throttlers
    async shouldSkip(context) {
        const skipMetadata = this.reflector.getAllAndOverride("THROTTLER:SKIP", [context.getHandler(), context.getClass()]);
        if (skipMetadata === true)
            return true;
        if (typeof skipMetadata === "object" &&
            Object.values(skipMetadata).some((v) => v === true))
            return true;
        return false;
    }
    async getTracker(req) {
        if (req.user?.id) {
            return `u:${req.user.id}`;
        }
        const ip = this.extractRealIp(req);
        return `ip:${ip}`;
    }
    extractRealIp(req) {
        const socketIp = req.ip ?? req.socket?.remoteAddress ?? "unknown";
        const normalizedSocket = this.normalizeIp(socketIp);
        if (this.trustedProxyCount === 0) {
            return normalizedSocket;
        }
        const forwarded = req.headers?.["x-forwarded-for"];
        if (!forwarded || typeof forwarded !== "string") {
            return normalizedSocket;
        }
        const ips = forwarded
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        if (ips.length === 0)
            return normalizedSocket;
        const clientIndex = Math.max(0, ips.length - this.trustedProxyCount - 1);
        const candidate = ips[clientIndex];
        if (!this.isValidIpFormat(candidate)) {
            return normalizedSocket;
        }
        return this.normalizeIp(candidate);
    }
    normalizeIp(ip) {
        if (!ip)
            return "unknown";
        if (ip.startsWith("::ffff:"))
            return ip.slice(7);
        return ip;
    }
    isValidIpFormat(ip) {
        if (!ip)
            return false;
        const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6 = /^[0-9a-fA-F:]+$/;
        return ipv4.test(ip) || ipv6.test(ip);
    }
    async canActivate(context) {
        try {
            return await super.canActivate(context);
        }
        catch (err) {
            if (err instanceof throttler_1.ThrottlerException) {
                const res = context.switchToHttp().getResponse();
                const retryAfter = Number(res.getHeader?.("Retry-After") ?? 60);
                throw new common_1.HttpException({
                    code: "RATE_LIMIT_EXCEEDED",
                    message: "Too many requests. Please wait before trying again.",
                    retryAfter,
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw err;
        }
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object, Object, core_1.Reflector])
], RateLimitGuard);
