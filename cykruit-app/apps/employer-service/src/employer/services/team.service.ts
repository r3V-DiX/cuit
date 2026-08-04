// apps/employer-service/src/employer/services/team.service.ts

import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    ConflictException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployerMemberRole, UserRole } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { HashService } from '@cykruit/common';
import { MailService } from '@cykruit/mail';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { PermissionsService } from '@cykruit/permissions';
import { AuditService } from '@cykruit/audit';
import { EmployerLimitsService } from '@cykruit/subscription';
import { CompanyRepository } from '../repositories/company.repository';
import { TeamRepository } from '../repositories/team.repository';
import {
    InviteMemberDto,
    UpdateMemberRoleDto,
    TransferOwnershipDto,
} from '../dto/team.dto';

// Token expiry: 7 days in milliseconds.
const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Roles permitted to send invitations.
 */
const CAN_INVITE = new Set<EmployerMemberRole>([
    EmployerMemberRole.OWNER,
    EmployerMemberRole.HIRING_MANAGER,
]);

/**
 * Roles permitted to remove members.
 */
const CAN_REMOVE = new Set<EmployerMemberRole>([
    EmployerMemberRole.OWNER,
    EmployerMemberRole.HIRING_MANAGER,
]);

@Injectable()
export class TeamService {
    private readonly logger = new Logger(TeamService.name);

    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly mailService: MailService,
        private readonly prisma: PrismaService,
        private readonly hashService: HashService,
        private readonly configService: ConfigService,
        private readonly eventPublisher: EventPublisher,
        private readonly permissionsService: PermissionsService,
        private readonly auditService: AuditService,
        private readonly employerLimitsService: EmployerLimitsService,
    ) {}

    // ── Get Team ─────────────────────────────────────────────────

    async getTeam(userId: string) {
        const employer = await this.requireEmployer(userId);
        return this.teamRepository.findMembers(employer.id);
    }

    async getMyRole(userId: string): Promise<{ role: string | null }> {
        const member = await this.teamRepository.findMyMembership(userId);
        return { role: member?.role ?? null };
    }

    // ── Invite Member ─────────────────────────────────────────────

    async inviteMember(userId: string, dto: InviteMemberDto, ipAddress?: string, userAgent?: string) {
        const employer = await this.requireEmployer(userId);

        // Verify inviter has sufficient role.
        const inviterMember = await this.teamRepository.findMember(employer.id, userId);
        if (!inviterMember || !CAN_INVITE.has(inviterMember.role)) {
            throw new ForbiddenException(
                'Only OWNER or HIRING_MANAGER can invite team members.',
            );
        }

        // HIRING_MANAGER can only invite roles below their tier (RECRUITER, VIEWER).
        // Only OWNER can issue HIRING_MANAGER invitations.
        if (
            inviterMember.role === EmployerMemberRole.HIRING_MANAGER &&
            dto.role === EmployerMemberRole.HIRING_MANAGER
        ) {
            throw new ForbiddenException(
                'HIRING_MANAGER can only invite members at RECRUITER tier or below.',
            );
        }

        // Check subscription limit (current members + pending invites combined).
        const [currentMembers, pendingInvites] = await Promise.all([
            this.teamRepository.findMembers(employer.id),
            this.teamRepository.countPendingInvites(employer.id),
        ]);
        const limits = await this.employerLimitsService.resolveForEmployer(employer.id);
        if (currentMembers.length + pendingInvites >= limits.maxTeamMembers) {
            throw new BadRequestException(
                `Team member limit reached (${limits.maxTeamMembers}). Upgrade your subscription to invite more.`,
            );
        }

        // Check whether the email already belongs to an existing member.
        const existingUserWithEmail = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUserWithEmail) {
            const alreadyMember = await this.teamRepository.findMember(
                employer.id,
                existingUserWithEmail.id,
            );
            if (alreadyMember) {
                throw new ConflictException(
                    'This user is already a member of your team.',
                );
            }
        }

        // Build compound raw token: "<role>:<uuid>" so the role survives round-trip
        // without needing a separate metadata store.
        const rawToken = `${dto.role}:${crypto.randomUUID()}`;
        const hashedToken = this.hashService.hashToken(rawToken);

        const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);
        await this.teamRepository.createInviteToken(userId, hashedToken, expiresAt, employer.id, dto.email, dto.role);

        // Fetch inviter details for the email.
        const inviterUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
        });
        const inviterName = inviterUser
            ? `${inviterUser.firstName} ${inviterUser.lastName}`
            : 'A team member';

        // Robust APP_URL resolution: `??` only catches null/undefined, so an
        // APP_URL that is empty or a bare "http://" slips through and produces a
        // broken "http:///employer/accept-invite" link in the invite email. Fall
        // back unless the value is a real absolute http(s) URL, then strip any
        // trailing slash so joining with "/employer/..." never double-slashes.
        const rawAppUrl = this.configService.get<string>('APP_URL') || '';
        const appUrl = /^https?:\/\/.+/.test(rawAppUrl)
            ? rawAppUrl.replace(/\/+$/, '')
            : 'http://localhost:3000';
        const inviteUrl = `${appUrl}/employer/accept-invite?token=${encodeURIComponent(rawToken)}`;

        // Send invite email — best-effort. The invite token row already exists,
        // so an email failure must not surface as a 500 (the inviter would retry
        // and create a duplicate invite, and the existing invite would be hidden).
        try {
            await this.mailService.sendEmployerInvite(
                dto.email,
                {
                    inviteeName: 'Hiring Professional',
                    inviterName,
                    companyName: employer.companyName,
                    companyLogo: employer.companyLogo || null,
                    assignedRole: dto.role === EmployerMemberRole.HIRING_MANAGER ? 'Hiring Manager' : 'Recruiter',
                    inviteUrl,
                    expiresInHours: 168,
                }
            );
        } catch (err) {
            this.logger.warn(
                `Invite email to ${dto.email} failed (invite is still active): ${String(err)}`,
                TeamService.name,
            );
        }

        // Publish event for in-app notification if invitee has an account
        this.eventPublisher.publish(
            DomainEventType.TEAM_INVITE_SENT,
            {
                inviteToken: rawToken,
                employerId: employer.id,
                companyName: employer.companyName,
                invitedEmail: dto.email,
                invitedUserId: existingUserWithEmail?.id,
                role: dto.role,
            },
            'employer-service',
        );

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'team:invite',
            module: 'TEAM',
            targetType: 'Employer',
            targetId: employer.id,
            newData: { invitedEmail: dto.email, role: dto.role },
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return { message: 'Invitation sent successfully.' };
    }

    // ── Preview Invite ────────────────────────────────────────────

    async previewInvite(rawToken: string, userId?: string) {
        const colonIndex = rawToken.indexOf(':');
        if (colonIndex === -1) {
            throw new BadRequestException('Invalid invite token format.');
        }

        const roleSegment = rawToken.substring(0, colonIndex);
        const targetRole = this.parseRole(roleSegment);

        const hashedToken = this.hashService.hashToken(rawToken);
        const tokenRecord = await this.teamRepository.findInviteToken(hashedToken);

        if (!tokenRecord) {
            throw new BadRequestException('Invite token is invalid or has already been used.');
        }

        if (new Date() >= tokenRecord.expiresAt) {
            throw new BadRequestException('Invite token has expired. Please request a new invitation.');
        }

        const employer = await this.companyRepository.findByMemberId(tokenRecord.userId);
        if (!employer) {
            throw new BadRequestException('The company associated with this invitation no longer exists.');
        }

        let requiresRoleUpgrade = false;
        if (userId) {
            const viewer = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true },
            });
            requiresRoleUpgrade = viewer?.role === UserRole.SEEKER;
        }

        return {
            companyName: employer.companyName,
            companyLogo: employer.companyLogo ?? null,
            role: targetRole,
            expiresAt: tokenRecord.expiresAt,
            invitedEmail: (tokenRecord.metadata as { invitedEmail?: string } | null)?.invitedEmail ?? null,
            requiresRoleUpgrade,
        };
    }

    // ── Accept Invite ─────────────────────────────────────────────

    async acceptInvite(userId: string, rawToken: string) {
        // Validate token format.
        const colonIndex = rawToken.indexOf(':');
        if (colonIndex === -1) {
            throw new BadRequestException('Invalid invite token format.');
        }

        const roleSegment = rawToken.substring(0, colonIndex);
        const targetRole = this.parseRole(roleSegment);

        const hashedToken = this.hashService.hashToken(rawToken);
        const tokenRecord = await this.teamRepository.findInviteToken(hashedToken);

        if (!tokenRecord) {
            throw new BadRequestException('Invite token is invalid or has already been used.');
        }

        if (new Date() >= tokenRecord.expiresAt) {
            throw new BadRequestException('Invite token has expired. Please request a new invitation.');
        }

        // Verify accepting user's email matches the invited email.
        const acceptingUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true },
        });
        const invitedEmail = (tokenRecord.metadata as { invitedEmail?: string } | null)?.invitedEmail;
        if (!acceptingUser || !invitedEmail || acceptingUser.email.toLowerCase() !== invitedEmail.toLowerCase()) {
            throw new ForbiddenException(
                'This invitation was issued to a different email address.',
            );
        }

        // Only SEEKER and EMPLOYER roles may accept an invite.
        // ADMIN accounts are not eligible for team membership.
        if (acceptingUser.role !== UserRole.SEEKER && acceptingUser.role !== UserRole.EMPLOYER) {
            throw new ForbiddenException(
                'Your account type is not eligible to join a company team.',
            );
        }

        const roleUpgraded = acceptingUser.role === UserRole.SEEKER;

        // Derive employer from the inviter's membership.
        const inviterUserId = tokenRecord.userId;
        const employer = await this.companyRepository.findByMemberId(inviterUserId);
        if (!employer) {
            throw new BadRequestException(
                'The company associated with this invitation no longer exists.',
            );
        }

        // Ensure invited user is not already a member of this company.
        const existingMembership = await this.teamRepository.findMember(employer.id, userId);
        if (existingMembership) {
            throw new ConflictException('You are already a member of this company.');
        }

        // Atomically: consume token first (prevents race-condition double-accept),
        // then upgrade role + create membership + revoke sessions + cancel pending
        // join request. The token update returns 0 rows if already used — TX aborts.
        const member = await this.prisma.$transaction(async (tx) => {
            // Claim the token atomically. If a concurrent request already consumed it,
            // this update matches 0 rows and we throw before any side effects occur.
            const claimed = await tx.token.updateMany({
                where: { id: tokenRecord.id, usedAt: null },
                data: { usedAt: new Date() },
            });
            if (claimed.count === 0) {
                throw new BadRequestException('Invite token is invalid or has already been used.');
            }

            if (roleUpgraded) {
                await tx.user.update({
                    where: { id: userId },
                    data: { role: UserRole.EMPLOYER },
                });
                // Revoke all existing sessions so stale SEEKER role cookie cannot be used.
                await tx.session.updateMany({
                    where: { userId, isActive: true },
                    data: { isActive: false, revokedAt: new Date(), revokedBy: 'role_upgrade' },
                });
            }

            const newMember = await tx.employerMember.create({
                data: {
                    employerId: employer.id,
                    userId,
                    role: targetRole,
                    ...(inviterUserId ? { invitedBy: inviterUserId } : {}),
                },
            });

            // Cancel any pending join request for this employer — invite supersedes it.
            await tx.employerJoinRequest.updateMany({
                where: { requesterId: userId, employerId: employer.id, status: 'PENDING' },
                data: { status: 'ACCEPTED', resolvedAt: new Date() },
            });

            return newMember;
        });

        await this.permissionsService.invalidateUserCache(userId, employer.id);

        if (roleUpgraded) {
            this.auditService.logAction({
                actorId: userId,
                actorRole: 'EMPLOYER',
                action: 'account:role_upgraded',
                module: 'AUTH',
                targetType: 'User',
                targetId: userId,
                oldData: { role: UserRole.SEEKER },
                newData: { role: UserRole.EMPLOYER },
                riskLevel: 'MEDIUM',
                result: 'SUCCESS',
            });
        }

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'team:accept_invite',
            module: 'TEAM',
            targetType: 'Employer',
            targetId: employer.id,
            newData: { role: targetRole, invitedBy: inviterUserId, roleUpgraded },
            result: 'SUCCESS',
        });

        this.eventPublisher.publish(
            DomainEventType.TEAM_INVITE_ACCEPTED,
            {
                userId,
                employerId: employer.id,
                companyName: employer.companyName,
                role: targetRole,
                roleUpgraded,
            },
            'employer-service',
        );

        await this.prisma.employerSubscription.updateMany({
            where: { employerId: employer.id },
            data: { currentTeamMembers: { increment: 1 } },
        }).catch((err: unknown) => this.logger.warn(`Failed to increment team member counter for employer ${employer.id}: ${String(err)}`));

        return member;
    }

    // ── Update Member Role ────────────────────────────────────────

    async updateMemberRole(userId: string, dto: UpdateMemberRoleDto, ipAddress?: string, userAgent?: string) {
        const employer = await this.requireEmployer(userId);

        const requesterMember = await this.teamRepository.findMember(employer.id, userId);
        if (!requesterMember || requesterMember.role !== EmployerMemberRole.OWNER) {
            throw new ForbiddenException('Only the OWNER can change member roles.');
        }

        const targetMember = await this.teamRepository.findMemberById(dto.memberId);
        if (!targetMember || targetMember.employerId !== employer.id) {
            throw new NotFoundException('Member not found in your company.');
        }

        // Cannot change own role through this endpoint.
        if (targetMember.userId === userId) {
            throw new BadRequestException(
                'You cannot change your own role. Use transfer-ownership to transfer ownership.',
            );
        }

        // Cannot promote to OWNER through this endpoint.
        if (dto.newRole === EmployerMemberRole.OWNER) {
            throw new BadRequestException(
                'Cannot set role to OWNER. Use the transfer-ownership endpoint.',
            );
        }

        // Prevent no-op updates.
        if (targetMember.role === dto.newRole) {
            throw new BadRequestException('Member already has this role.');
        }

        const updated = await this.teamRepository.updateMemberRole(dto.memberId, dto.newRole);
        await this.permissionsService.invalidateUserCache(targetMember.userId, employer.id);

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'team:change_role',
            module: 'TEAM',
            targetType: 'EmployerMember',
            targetId: dto.memberId,
            oldData: { role: targetMember.role },
            newData: { role: dto.newRole },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return updated;
    }

    // ── Remove Member ─────────────────────────────────────────────

    async removeMember(userId: string, memberId: string, ipAddress?: string, userAgent?: string) {
        const employer = await this.requireEmployer(userId);

        const requesterMember = await this.teamRepository.findMember(employer.id, userId);
        if (!requesterMember || !CAN_REMOVE.has(requesterMember.role)) {
            throw new ForbiddenException(
                'Only OWNER or HIRING_MANAGER can remove team members.',
            );
        }

        const targetMember = await this.teamRepository.findMemberById(memberId);
        if (!targetMember || targetMember.employerId !== employer.id) {
            throw new NotFoundException('Member not found in your company.');
        }

        // Cannot remove yourself via this endpoint.
        if (targetMember.userId === userId) {
            throw new BadRequestException('Cannot remove yourself from the team.');
        }

        // Cannot remove the OWNER.
        if (targetMember.role === EmployerMemberRole.OWNER) {
            throw new BadRequestException(
                'Cannot remove the company OWNER. Transfer ownership first.',
            );
        }

        // HIRING_MANAGER can only remove RECRUITER-level members.
        if (
            requesterMember.role === EmployerMemberRole.HIRING_MANAGER &&
            targetMember.role === EmployerMemberRole.HIRING_MANAGER
        ) {
            throw new ForbiddenException(
                'HIRING_MANAGERs cannot remove other HIRING_MANAGERs.',
            );
        }

        await this.teamRepository.removeMember(memberId);
        await this.permissionsService.invalidateUserCache(targetMember.userId, employer.id);

        await this.prisma.employerSubscription.updateMany({
            where: { employerId: employer.id, currentTeamMembers: { gt: 0 } },
            data: { currentTeamMembers: { decrement: 1 } },
        }).catch((err: unknown) => this.logger.warn(`Failed to decrement team member counter for employer ${employer.id}: ${String(err)}`));

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'team:remove_member',
            module: 'TEAM',
            targetType: 'EmployerMember',
            targetId: memberId,
            oldData: { userId: targetMember.userId, role: targetMember.role },
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return { message: 'Member removed successfully.' };
    }

    // ── Transfer Ownership ────────────────────────────────────────

    async transferOwnership(userId: string, dto: TransferOwnershipDto, ipAddress?: string, userAgent?: string) {
        const employer = await this.requireEmployer(userId);

        const currentOwnerMember = await this.teamRepository.findMember(employer.id, userId);
        if (!currentOwnerMember || currentOwnerMember.role !== EmployerMemberRole.OWNER) {
            throw new ForbiddenException('Only the current OWNER can transfer ownership.');
        }

        const newOwnerMember = await this.teamRepository.findMemberById(dto.newOwnerMemberId);
        if (!newOwnerMember || newOwnerMember.employerId !== employer.id) {
            throw new NotFoundException('The specified new owner is not a member of your company.');
        }

        if (newOwnerMember.userId === userId) {
            throw new BadRequestException('You are already the OWNER of this company.');
        }

        await this.teamRepository.transferOwnership(
            employer.id,
            dto.newOwnerMemberId,
            currentOwnerMember.id,
            dto.currentOwnerNewRole,
        );

        // Invalidate cache for both old and new owner — roles swapped
        await Promise.all([
            this.permissionsService.invalidateUserCache(userId, employer.id),
            this.permissionsService.invalidateUserCache(newOwnerMember.userId, employer.id),
        ]);

        this.auditService.logAction({
            actorId: userId,
            actorRole: 'EMPLOYER',
            action: 'team:transfer_ownership',
            module: 'TEAM',
            targetType: 'Employer',
            targetId: employer.id,
            oldData: { ownerUserId: userId },
            newData: { ownerUserId: newOwnerMember.userId },
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            ipAddress,
            metadata: { userAgent },
        });

        return this.teamRepository.findMembers(employer.id);
    }

    // ── Get Invites ───────────────────────────────────────────────

    async getInvites(userId: string) {
        const employer = await this.requireEmployer(userId);

        const member = await this.teamRepository.findMember(employer.id, userId);
        if (!member || !CAN_INVITE.has(member.role)) {
            throw new ForbiddenException(
                'Only OWNER or HIRING_MANAGER can view invitations.',
            );
        }

        const tokens = await this.teamRepository.getInvites(employer.id);
        const now = new Date();

        return tokens.map((token) => {
            const meta = token.metadata as { invitedEmail?: string; role?: string } | null;
            return {
                id: token.id,
                invitedEmail: meta?.invitedEmail ?? '',
                role: meta?.role ?? 'RECRUITER',
                invitedBy: token.user
                    ? `${token.user.firstName} ${token.user.lastName}`
                    : '',
                createdAt: token.createdAt,
                expiresAt: token.expiresAt,
                status: token.usedAt
                    ? 'ACCEPTED'
                    : token.expiresAt < now
                      ? 'EXPIRED'
                      : 'PENDING',
            };
        });
    }

    // ── Revoke Invite ─────────────────────────────────────────────

    async revokeInvite(userId: string, tokenId: string) {
        const employer = await this.requireEmployer(userId);

        const member = await this.teamRepository.findMember(employer.id, userId);
        if (!member || !CAN_INVITE.has(member.role)) {
            throw new ForbiddenException(
                'Only OWNER or HIRING_MANAGER can revoke invitations.',
            );
        }

        const token = await this.teamRepository.findInviteById(tokenId, employer.id);
        if (!token) {
            throw new NotFoundException('Invitation not found.');
        }

        if (token.usedAt != null) {
            throw new BadRequestException('Invitation has already been accepted.');
        }

        if (token.expiresAt < new Date()) {
            throw new BadRequestException('Invitation has already expired.');
        }

        await this.teamRepository.expireInvite(tokenId);

        return { message: 'Invitation revoked successfully.' };
    }

    // ── Private Helpers ───────────────────────────────────────────

    private async requireEmployer(userId: string) {
        const employer = await this.companyRepository.findByMemberId(userId);
        if (!employer) {
            throw new NotFoundException(
                'No company found for your account. Set up your company first.',
            );
        }
        return employer;
    }

    private parseRole(segment: string): EmployerMemberRole {
        const valid = Object.values(EmployerMemberRole) as string[];
        if (!valid.includes(segment)) {
            throw new BadRequestException('Invalid invite token: unrecognised role.');
        }
        return segment as EmployerMemberRole;
    }
}
