// admin-app/src/admin/services/admins.service.ts

import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { generateRawToken, hashToken } from '@cykruit/auth-core';
import { MailService } from '@cykruit/mail';
import { AdminsRepository } from './admins.repository';
import { AdminAuditLogger } from '../../common';
import { AdminAuthAuditLogger } from '../../common';
import { isProtectedRootAdmin } from '../../common';
import { AcceptInviteDto, AdminListQueryDto, InviteAdminDto } from './dto/admins.dto';

const INVITE_TTL_HOURS = 48;

@Injectable()
export class AdminsService {
    constructor(
        private readonly repo: AdminsRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly authAuditLogger: AdminAuthAuditLogger,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) {}

    list(query: AdminListQueryDto) {
        return this.repo.findAll(query);
    }

    async invite(inviterAdminId: string, inviterName: string, dto: InviteAdminDto) {
        const existingAdmin = await this.repo.findByEmail(dto.email);
        if (existingAdmin) {
            throw new ConflictException('An admin with this email already exists');
        }

        const pendingInvite = await this.repo.findPendingInviteByEmail(dto.email);
        if (pendingInvite) {
            throw new ConflictException('An invite is already pending for this email');
        }

        const rawToken = generateRawToken();
        const hashedToken = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

        const invite = await this.repo.createInvite({
            email: dto.email,
            hashedToken,
            invitedBy: inviterAdminId,
            roleId: dto.roleId,
            expiresAt,
        });

        const adminAppUrl = this.configService.get<string>('ADMIN_APP_URL') ?? 'http://localhost:3100';
        const inviteUrl = `${adminAppUrl}/accept-invite?token=${encodeURIComponent(rawToken)}`;

        await this.mailService.sendAdminInvite(dto.email, {
            inviteeEmail: dto.email,
            inviterName,
            inviteUrl,
            expiresInHours: INVITE_TTL_HOURS,
        });

        this.auditLogger.log({
            adminId: inviterAdminId,
            action: 'admins:invite',
            module: 'admins',
            resource: 'AdminInvite',
            resourceId: invite.id,
            newData: { email: dto.email, roleId: dto.roleId } as unknown as Prisma.InputJsonValue,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return { message: 'Invitation sent successfully' };
    }

    async acceptInvite(dto: AcceptInviteDto, ipAddress?: string, userAgent?: string) {
        const hashedToken = hashToken(dto.token);
        const invite = await this.repo.findInviteByToken(hashedToken);

        if (!invite || invite.status !== 'PENDING') {
            throw new BadRequestException('Invite token is invalid or has already been used');
        }

        if (invite.expiresAt <= new Date()) {
            throw new BadRequestException('Invite token has expired. Ask a super admin to resend it.');
        }

        const admin = await this.repo.acceptInvite(invite, {
            firstName: dto.firstName,
            lastName: dto.lastName,
        });

        this.auditLogger.log({
            adminId: admin.id,
            action: 'admins:invite-accept',
            module: 'admins',
            resource: 'Admin',
            resourceId: admin.id,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        this.authAuditLogger.log({
            action: 'ADMIN_ACCOUNT_ACTIVATED',
            status: 'SUCCESS',
            adminId: admin.id,
            ipAddress,
            userAgent,
        });

        return { admin };
    }

    listInvites(query: AdminListQueryDto) {
        return this.repo.findPendingInvites(query);
    }

    async revokeInvite(currentAdminId: string, id: string) {
        const invite = await this.repo.findInviteById(id);
        if (!invite || invite.status !== 'PENDING') {
            throw new NotFoundException('Pending invite not found');
        }

        const revoked = await this.repo.revokeInvite(id);

        this.auditLogger.log({
            adminId: currentAdminId,
            action: 'admins:invite-revoke',
            module: 'admins',
            resource: 'AdminInvite',
            resourceId: id,
            newData: { email: invite.email } as unknown as Prisma.InputJsonValue,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return revoked;
    }

    async deactivate(currentAdminId: string, id: string) {
        if (currentAdminId === id) {
            throw new BadRequestException('You cannot deactivate your own account');
        }

        const admin = await this.getById(id);
        if (!admin.isActive) {
            throw new BadRequestException('Admin is already inactive');
        }

        const bootstrapEmail = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');
        if (isProtectedRootAdmin(admin.email, bootstrapEmail)) {
            throw new ForbiddenException('This account is protected and cannot be deactivated.');
        }

        const updated = await this.repo.deactivate(id);

        this.auditLogger.log({
            adminId: currentAdminId,
            action: 'admins:deactivate',
            module: 'admins',
            resource: 'Admin',
            resourceId: id,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return updated;
    }

    async reactivate(currentAdminId: string, id: string) {
        const admin = await this.getById(id);
        if (admin.isActive) {
            throw new BadRequestException('Admin is already active');
        }

        const updated = await this.repo.reactivate(id);

        this.auditLogger.log({
            adminId: currentAdminId,
            action: 'admins:reactivate',
            module: 'admins',
            resource: 'Admin',
            resourceId: id,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return updated;
    }

    private async getById(id: string) {
        const admin = await this.repo.findById(id);
        if (!admin) throw new NotFoundException('Admin not found');
        return admin;
    }
}
