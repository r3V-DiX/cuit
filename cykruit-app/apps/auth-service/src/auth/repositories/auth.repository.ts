// apps/auth-service/src/auth/repositories/auth.repository.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { hashToken } from "@cykruit/auth-core";
import {
  User,
  AccountStatus,
  UserRole,
  DeviceType,
  SessionType,
} from "@prisma/client";

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── User Queries ─────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobSeekerProfile: true,
        employer: {
          include: {
            verifications: {
              where: { isLatest: true },
              orderBy: { submittedAt: "desc" },
              take: 1,
            },
          },
        },
      },
    }) as any;
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  // ── User Mutations ───────────────────────────────────────────

  async createUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }): Promise<User> {
    return this.prisma.user.create({
      data: { ...data, status: AccountStatus.PENDING, isEmailVerified: false },
    });
  }

  async markEmailAsVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        status: AccountStatus.ACTIVE,
      },
    });
  }

  async updateLastLogin(userId: string, ipAddress: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date(), lastLoginIp: ipAddress },
    });
  }

  async updateAccountStatus(
    userId: string,
    status: AccountStatus,
  ): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { status } });
  }

  // ── Session Queries ──────────────────────────────────────────

  async findSessionByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async findUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findSessionByRefreshHash(refreshTokenHash: string) {
    return this.prisma.session.findFirst({
      where: { refreshTokenHash, isActive: true },
      include: { user: true },
    });
  }

  // ── Session Mutations ────────────────────────────────────────

  async createSession(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    rememberMe: boolean;
    userAgent?: string;
    ipAddress?: string;
    deviceType?: DeviceType;
    sessionType?: SessionType;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
    refreshTokenHash?: string;
  }) {
    return this.prisma.session.create({
      data: { ...data, isActive: true, lastActivity: new Date() },
    });
  }

  async updateSessionActivity(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async rotateSession(
    oldToken: string,
    newToken: string,
    newExpiresAt: Date,
  ): Promise<void> {
    await this.prisma.session.update({
      where: { token: hashToken(oldToken) },
      data: {
        token: hashToken(newToken),
        expiresAt: newExpiresAt,
        lastActivity: new Date(),
        isActive: true,
      },
    });
  }

  async deleteSession(token: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { token: hashToken(token) },
      data: { isActive: false, revokedAt: new Date(), revokedBy: "user" },
    });
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedBy: "user" },
    });
  }

  async revokeSession(sessionId: string, revokedBy = "user"): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false, revokedAt: new Date(), revokedBy },
    });
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: { expiresAt: { lt: new Date() }, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedBy: "system" },
    });
    return result.count;
  }

  // ── Verification Token Methods ───────────────────────────────
  // FIX: These were called by VerificationService but didn't exist

  async findVerificationToken(hashedToken: string) {
    return this.prisma.token.findFirst({
      where: {
        token: hashedToken,
        type: "EMAIL_VERIFICATION",
        usedAt: null,
      },
      include: { user: true },
    });
  }

  async findActiveVerificationToken(userId: string) {
    return this.prisma.token.findFirst({
      where: {
        userId,
        type: "EMAIL_VERIFICATION",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createVerificationToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
  ) {
    return this.prisma.token.create({
      data: {
        userId,
        token: hashedToken,
        type: "EMAIL_VERIFICATION",
        expiresAt,
      },
    });
  }

  // ── Password Reset Token Methods ─────────────────────────────
  // FIX: These were called by PasswordService but didn't exist

  async createPasswordResetToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
  ) {
    // Invalidate any existing unused reset tokens first
    await this.prisma.token.updateMany({
      where: { userId, type: "PASSWORD_RESET", usedAt: null },
      data: { usedAt: new Date() },
    });

    return this.prisma.token.create({
      data: {
        userId,
        token: hashedToken,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });
  }

  async findPasswordResetToken(hashedToken: string) {
    return this.prisma.token.findFirst({
      where: {
        token: hashedToken,
        type: "PASSWORD_RESET",
        usedAt: null,
      },
      include: { user: true },
    });
  }

  // ── Generic Token Methods (kept for compatibility) ────────────

  async findToken(token: string) {
    return this.prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async findUserTokensByType(
    userId: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  ) {
    return this.prisma.token.findMany({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
    });
  }

  async createToken(data: {
    userId: string;
    token: string;
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
    expiresAt: Date;
  }) {
    return this.prisma.token.create({ data });
  }

  async markTokenAsUsed(tokenId: string) {
    return this.prisma.token.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  async deleteToken(tokenId: string): Promise<void> {
    await this.prisma.token.delete({ where: { id: tokenId } });
  }

  async deleteAllUserTokens(userId: string): Promise<void> {
    await this.prisma.token.deleteMany({ where: { userId } });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await this.prisma.token.deleteMany({
      where: { expiresAt: { lt: new Date() }, usedAt: null },
    });
    return result.count;
  }

  // ── Transactions ─────────────────────────────────────────────

  async verifyEmailAndDeleteToken(tokenId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          status: AccountStatus.ACTIVE,
        },
      });
      await tx.token.delete({ where: { id: tokenId } });
      return user;
    });
  }

}
