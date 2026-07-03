"use strict";
// libs/common/services/token.service.ts
//
// RESPONSIBILITIES:
//   createJwtToken / createWsToken  → stateless JWTs (never stored in DB)
//   createEmailVerificationToken    → stored as SHA256 hash, returns raw token
//   createPasswordResetToken        → stored as SHA256 hash, returns raw token
//   validate*Token                  → hash input, lookup hash, check expiry/used
//
// NOTE: AuthRepository (auth-service) manages its own tokens for the auth flow.
//       This service is used by other services (e.g. ws-token for WebSocket handshake).
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_1 = require("@cykruit/prisma");
let TokenService = class TokenService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtSecret =
            this.configService.get("JWT_SECRET") || "your-secret-key";
    }
    // ─── Helpers ─────────────────────────────────────────────────────────────────
    generateSecureToken() {
        return (0, crypto_1.randomBytes)(32).toString("hex");
    }
    /** SHA-256 hash — used so raw tokens are never stored in DB */
    hashToken(token) {
        return (0, crypto_1.createHash)("sha256").update(token).digest("hex");
    }
    // ─── JWTs (stateless — never stored in DB) ──────────────────────────────────
    decodeToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return { sub: decoded.sub, email: decoded.email, role: decoded.role };
        }
        catch {
            return null;
        }
    }
    /**
     * General-purpose JWT — kept for internal service-to-service use.
     * Do NOT use for WebSocket handshake tokens; use createWsToken() instead.
     */
    createJwtToken(userId, email, role) {
        return jwt.sign({ sub: userId, email, role }, this.jwtSecret, {
            expiresIn: "7d",
        });
    }
    /**
     * ✅ Short-lived JWT for WebSocket handshake.
     * The client sends this once during the WS upgrade — 5 minutes is plenty.
     * A 7-day token is a huge window if intercepted in transit.
     */
    createWsToken(userId, email, role) {
        return jwt.sign({ sub: userId, email, role, type: "ws" }, this.jwtSecret, {
            expiresIn: "5m",
        });
    }
    // ─── DB Tokens (email verification & password reset) ────────────────────────
    //
    // Flow:
    //   1. Generate raw random token (returned to caller → sent in email)
    //   2. Hash it with SHA-256 → store ONLY the hash in DB
    //   3. On validation: hash incoming token → lookup hash → check expiry/used
    //
    // ✅ This matches the pattern used in AuthRepository (auth-service).
    async createEmailVerificationToken(userId) {
        const rawToken = this.generateSecureToken();
        const hashedToken = this.hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await this.prisma.token.create({
            data: {
                token: hashedToken, // ✅ store hash, never raw
                type: client_1.TokenType.EMAIL_VERIFICATION,
                userId,
                expiresAt,
            },
        });
        return rawToken; // ← raw token goes in the email link
    }
    async createPasswordResetToken(userId) {
        // Revoke any existing unused reset tokens first
        const existing = await this.prisma.token.findMany({
            where: { userId, type: client_1.TokenType.PASSWORD_RESET, usedAt: null },
        });
        for (const t of existing) {
            await this.prisma.token.update({
                where: { id: t.id },
                data: { usedAt: new Date() }, // soft-invalidate, keep audit trail
            });
        }
        const rawToken = this.generateSecureToken();
        const hashedToken = this.hashToken(rawToken);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await this.prisma.token.create({
            data: {
                token: hashedToken, // ✅ store hash, never raw
                type: client_1.TokenType.PASSWORD_RESET,
                userId,
                expiresAt,
            },
        });
        return rawToken;
    }
    async validateEmailVerificationToken(rawToken) {
        const hashedToken = this.hashToken(rawToken);
        const record = await this.prisma.token.findFirst({
            where: {
                token: hashedToken,
                type: client_1.TokenType.EMAIL_VERIFICATION,
                usedAt: null,
            },
        });
        if (!record)
            throw new common_1.BadRequestException("Invalid or expired verification token");
        if (new Date() > record.expiresAt)
            throw new common_1.BadRequestException("Verification token has expired");
        await this.prisma.token.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        });
        return record.userId;
    }
    async validatePasswordResetToken(rawToken) {
        const hashedToken = this.hashToken(rawToken);
        const record = await this.prisma.token.findFirst({
            where: {
                token: hashedToken,
                type: client_1.TokenType.PASSWORD_RESET,
                usedAt: null,
            },
        });
        if (!record)
            throw new common_1.BadRequestException("Invalid or expired reset token");
        if (new Date() > record.expiresAt)
            throw new common_1.BadRequestException("Reset token has expired");
        await this.prisma.token.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        });
        return record.userId;
    }
    async verifyPasswordResetToken(rawToken) {
        const hashedToken = this.hashToken(rawToken);
        const record = await this.prisma.token.findFirst({
            where: {
                token: hashedToken,
                type: client_1.TokenType.PASSWORD_RESET,
                usedAt: null,
            },
        });
        if (!record || new Date() > record.expiresAt)
            return false;
        return true;
    }
    async deleteUserTokens(userId) {
        await this.prisma.token.deleteMany({ where: { userId } });
    }
    async cleanupExpiredTokens() {
        const result = await this.prisma.token.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        config_1.ConfigService])
], TokenService);
