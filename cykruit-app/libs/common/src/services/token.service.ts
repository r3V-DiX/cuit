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

import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TokenType } from "@prisma/client";
import { randomBytes, createHash } from "crypto";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "@cykruit/prisma";

@Injectable()
export class TokenService {
  private jwtSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>("JWT_SECRET") || "your-secret-key";
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private generateSecureToken(): string {
    return randomBytes(32).toString("hex");
  }

  /** SHA-256 hash — used so raw tokens are never stored in DB */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  // ─── JWTs (stateless — never stored in DB) ──────────────────────────────────

  decodeToken(
    token: string,
  ): { sub: string; email: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return { sub: decoded.sub, email: decoded.email, role: decoded.role };
    } catch {
      return null;
    }
  }

  /**
   * General-purpose JWT — kept for internal service-to-service use.
   * Do NOT use for WebSocket handshake tokens; use createWsToken() instead.
   */
  createJwtToken(userId: string, email: string, role: string): string {
    return jwt.sign({ sub: userId, email, role }, this.jwtSecret, {
      expiresIn: "7d",
    });
  }

  /**
   * ✅ Short-lived JWT for WebSocket handshake.
   * The client sends this once during the WS upgrade — 5 minutes is plenty.
   * A 7-day token is a huge window if intercepted in transit.
   */
  createWsToken(userId: string, email: string, role: string): string {
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

  async createEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = this.generateSecureToken();
    const hashedToken = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.token.create({
      data: {
        token: hashedToken, // ✅ store hash, never raw
        type: TokenType.EMAIL_VERIFICATION,
        userId,
        expiresAt,
      },
    });

    return rawToken; // ← raw token goes in the email link
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    // Revoke any existing unused reset tokens first
    const existing = await this.prisma.token.findMany({
      where: { userId, type: TokenType.PASSWORD_RESET, usedAt: null },
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
        type: TokenType.PASSWORD_RESET,
        userId,
        expiresAt,
      },
    });

    return rawToken;
  }

  async validateEmailVerificationToken(rawToken: string): Promise<string> {
    const hashedToken = this.hashToken(rawToken);

    const record = await this.prisma.token.findFirst({
      where: {
        token: hashedToken,
        type: TokenType.EMAIL_VERIFICATION,
        usedAt: null,
      },
    });

    if (!record)
      throw new BadRequestException("Invalid or expired verification token");
    if (new Date() > record.expiresAt)
      throw new BadRequestException("Verification token has expired");

    await this.prisma.token.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return record.userId;
  }

  async validatePasswordResetToken(rawToken: string): Promise<string> {
    const hashedToken = this.hashToken(rawToken);

    const record = await this.prisma.token.findFirst({
      where: {
        token: hashedToken,
        type: TokenType.PASSWORD_RESET,
        usedAt: null,
      },
    });

    if (!record)
      throw new BadRequestException("Invalid or expired reset token");
    if (new Date() > record.expiresAt)
      throw new BadRequestException("Reset token has expired");

    await this.prisma.token.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return record.userId;
  }

  async verifyPasswordResetToken(rawToken: string): Promise<boolean> {
    const hashedToken = this.hashToken(rawToken);

    const record = await this.prisma.token.findFirst({
      where: {
        token: hashedToken,
        type: TokenType.PASSWORD_RESET,
        usedAt: null,
      },
    });

    if (!record || new Date() > record.expiresAt) return false;
    return true;
  }

  async deleteUserTokens(userId: string): Promise<void> {
    await this.prisma.token.deleteMany({ where: { userId } });
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.token.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
