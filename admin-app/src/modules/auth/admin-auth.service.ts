// admin-app/src/admin/auth/admin-auth.service.ts
// Console auth against the Admin model (admins + admin_sessions).
// Opaque session token: raw value goes to the cookie, SHA-256 hash to the DB
// (same hashToken/generateRawToken utils the main auth-service uses).

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { generateRawToken, hashToken, resolveSessionExpiry } from '@cykruit/auth-core';
import { compare } from 'bcryptjs';
import type { Admin } from '@prisma/client';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthAuditLogger } from '../../common';

export interface AdminLoginResult {
    admin: Pick<Admin, 'id' | 'email' | 'firstName' | 'lastName'>;
    rawToken: string;
    expiresAt: Date;
}

@Injectable()
export class AdminAuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authAuditLogger: AdminAuthAuditLogger,
    ) {}

    private static readonly MAX_FAILED_ATTEMPTS = 5;
    private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    async login(
        dto: AdminLoginDto,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<AdminLoginResult> {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });

        // Generic error on every failure path — never reveal which part failed
        if (!admin || !admin.isActive) {
            this.authAuditLogger.log({
                action: 'ADMIN_LOGIN_FAILURE',
                status: 'FAILURE',
                adminId: admin?.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: !admin ? 'not_found' : 'inactive' },
            });
            throw new UnauthorizedException('Invalid credentials');
        }

        // Account lockout check
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
            this.authAuditLogger.log({
                action: 'ADMIN_LOGIN_FAILURE',
                status: 'FAILURE',
                adminId: admin.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: 'account_locked' },
            });
            throw new UnauthorizedException('Account temporarily locked. Try again later.');
        }

        const passwordValid = await compare(dto.password, admin.password);
        if (!passwordValid) {
            const newCount = admin.failedLoginAttempts + 1;
            const shouldLock = newCount >= AdminAuthService.MAX_FAILED_ATTEMPTS;
            await this.prisma.admin.update({
                where: { id: admin.id },
                data: {
                    failedLoginAttempts: newCount,
                    lockedUntil: shouldLock
                        ? new Date(Date.now() + AdminAuthService.LOCKOUT_DURATION_MS)
                        : null,
                },
            });
            this.authAuditLogger.log({
                action: 'ADMIN_LOGIN_FAILURE',
                status: 'FAILURE',
                adminId: admin.id,
                ipAddress,
                userAgent,
                metadata: { email: dto.email, reason: 'bad_password', attempt: newCount, locked: shouldLock },
            });
            throw new UnauthorizedException('Invalid credentials');
        }

        const rememberMe = dto.rememberMe ?? false;
        const rawToken = generateRawToken();
        const expiresAt = await resolveSessionExpiry(rememberMe);

        await this.prisma.$transaction([
            this.prisma.adminSession.create({
                data: {
                    adminId: admin.id,
                    token: hashToken(rawToken),
                    expiresAt,
                    rememberMe,
                    ipAddress,
                    userAgent,
                },
            }),
            this.prisma.admin.update({
                where: { id: admin.id },
                data: {
                    lastLogin: new Date(),
                    lastLoginIp: ipAddress,
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                },
            }),
        ]);

        this.authAuditLogger.log({
            action: 'ADMIN_LOGIN_SUCCESS',
            status: 'SUCCESS',
            adminId: admin.id,
            ipAddress,
            userAgent,
        });

        return {
            admin: {
                id: admin.id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
            },
            rawToken,
            expiresAt,
        };
    }

    /** Validates a raw session token and returns the active Admin. */
    async validateSession(rawToken: string): Promise<Admin> {
        const session = await this.prisma.adminSession.findUnique({
            where: { token: hashToken(rawToken) },
            select: {
                id: true,
                expiresAt: true,
                admin: {
                    select: {
                        id: true,
                        email: true,
                        password: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        profileImage: true,
                        isActive: true,
                        lastLogin: true,
                        lastLoginIp: true,
                        failedLoginAttempts: true,
                        lockedUntil: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        if (!session) {
            throw new UnauthorizedException('Session not found');
        }

        if (session.expiresAt <= new Date()) {
            await this.prisma.adminSession.delete({ where: { id: session.id } });
            throw new UnauthorizedException('Session expired');
        }

        if (!session.admin.isActive) {
            throw new UnauthorizedException('Account disabled');
        }

        // Fire-and-forget activity bump — not worth failing the request over
        this.prisma.adminSession
            .update({ where: { id: session.id }, data: { lastActivity: new Date() } })
            .catch(() => undefined);

        return session.admin;
    }

    async logout(rawToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
        const hashed = hashToken(rawToken);
        const session = await this.prisma.adminSession.findUnique({ where: { token: hashed } });

        await this.prisma.adminSession.deleteMany({ where: { token: hashed } });

        this.authAuditLogger.log({
            action: 'ADMIN_LOGOUT',
            status: 'SUCCESS',
            adminId: session?.adminId,
            ipAddress,
            userAgent,
        });
    }
}
