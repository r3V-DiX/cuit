import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@cykruit/prisma';
export declare class TokenService {
    private prisma;
    private configService;
    private jwtSecret;
    constructor(prisma: PrismaService, configService: ConfigService);
    private generateSecureToken;
    /** SHA-256 hash — used so raw tokens are never stored in DB */
    private hashToken;
    decodeToken(token: string): {
        sub: string;
        email: string;
        role: string;
    } | null;
    /**
     * General-purpose JWT — kept for internal service-to-service use.
     * Do NOT use for WebSocket handshake tokens; use createWsToken() instead.
     */
    createJwtToken(userId: string, email: string, role: string): string;
    /**
     * ✅ Short-lived JWT for WebSocket handshake.
     * The client sends this once during the WS upgrade — 5 minutes is plenty.
     * A 7-day token is a huge window if intercepted in transit.
     */
    createWsToken(userId: string, email: string, role: string): string;
    createEmailVerificationToken(userId: string): Promise<string>;
    createPasswordResetToken(userId: string): Promise<string>;
    validateEmailVerificationToken(rawToken: string): Promise<string>;
    validatePasswordResetToken(rawToken: string): Promise<string>;
    verifyPasswordResetToken(rawToken: string): Promise<boolean>;
    deleteUserTokens(userId: string): Promise<void>;
    cleanupExpiredTokens(): Promise<number>;
}
