// apps/employer-service/src/employer/services/team.service.ts

import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployerMemberRole } from '@prisma/client';
import { PrismaService } from '@cykruit/prisma';
import { HashService } from '@cykruit/common';
import { MailService } from '@cykruit/mail';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { PermissionsService } from '@cykruit/permissions';
import { CompanyRepository } from '../repositories/company.repository';
import { TeamRepository } from '../repositories/team.repository';
import {
    InviteMemberDto,
    UpdateMemberRoleDto,
    TransferOwnershipDto,
} from '../dto/team.dto';

// Default team size limit when no subscription package is found.
const DEFAULT_MAX_TEAM_MEMBERS = 3;

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
    constructor(
        private readonly teamRepository: TeamRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly mailService: MailService,
        private readonly prisma: PrismaService,
        private readonly hashService: HashService,
        private readonly configService: ConfigService,
        private readonly eventPublisher: EventPublisher,
        private readonly permissionsService: PermissionsService,
    ) {}

    // ── Get Team ─────────────────────────────────────────────────

    async getTeam(userId: string) {
        const employer = await this.requireEmployer(userId);
        return this.teamRepository.findMembers(employer.id);
    }

    // ── Invite Member ─────────────────────────────────────────────

    async inviteMember(userId: string, dto: InviteMemberDto) {
        const employer = await this.requireEmployer(userId);

        // Verify inviter has sufficient role.
        const inviterMember = await this.teamRepository.findMember(employer.id, userId);
        if (!inviterMember || !CAN_INVITE.has(inviterMember.role)) {
            throw new ForbiddenException(
                'Only OWNER or HIRING_MANAGER can invite team members.',
            );
        }

        // Check subscription limit (current members + pending invites combined).
        const [currentMembers, pendingInvites] = await Promise.all([
            this.teamRepository.findMembers(employer.id),
            this.teamRepository.countPendingInvites(employer.id),
        ]);
        const maxMembers = await this.resolveMaxTeamMembers(employer.id);
        if (currentMembers.length + pendingInvites >= maxMembers) {
            throw new BadRequestException(
                `Team member limit reached (${maxMembers}). Upgrade your subscription to invite more.`,
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
        await this.teamRepository.createInviteToken(userId, hashedToken, expiresAt, employer.id, dto.email);

        // Fetch inviter details for the email.
        const inviterUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true },
        });
        const inviterName = inviterUser
            ? `${inviterUser.firstName} ${inviterUser.lastName}`
            : 'A team member';

        const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
        const inviteUrl = `${appUrl}/employer/accept-invite?token=${encodeURIComponent(rawToken)}`;

        // Send invite email — non-throwing; logged inside MailService.
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

        return { message: 'Invitation sent successfully.' };
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

        if (new Date() > tokenRecord.expiresAt) {
            throw new BadRequestException('Invite token has expired. Please request a new invitation.');
        }

        // Verify accepting user's email matches the invited email.
        const acceptingUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        const invitedEmail = (tokenRecord.metadata as { invitedEmail?: string } | null)?.invitedEmail;
        if (!acceptingUser || !invitedEmail || acceptingUser.email.toLowerCase() !== invitedEmail.toLowerCase()) {
            throw new ForbiddenException(
                'This invitation was issued to a different email address.',
            );
        }

        // Derive employer from the inviter's membership.
        const inviterUserId = tokenRecord.userId;
        const employer = await this.companyRepository.findByMemberId(inviterUserId);
        if (!employer) {
            throw new BadRequestException(
                'The company associated with this invitation no longer exists.',
            );
        }

        // Ensure invited user is not already a member.
        const existingMembership = await this.teamRepository.findMember(employer.id, userId);
        if (existingMembership) {
            throw new ConflictException('You are already a member of this company.');
        }

        // Create membership and mark token consumed.
        const member = await this.teamRepository.addMember(
            employer.id,
            userId,
            targetRole,
            inviterUserId,
        );

        await this.teamRepository.markInviteUsed(tokenRecord.id);
        await this.permissionsService.invalidateUserCache(userId, employer.id);

        return member;
    }

    // ── Update Member Role ────────────────────────────────────────

    async updateMemberRole(userId: string, dto: UpdateMemberRoleDto) {
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
        return updated;
    }

    // ── Remove Member ─────────────────────────────────────────────

    async removeMember(userId: string, memberId: string) {
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

        return { message: 'Member removed successfully.' };
    }

    // ── Transfer Ownership ────────────────────────────────────────

    async transferOwnership(userId: string, dto: TransferOwnershipDto) {
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

        return this.teamRepository.findMembers(employer.id);
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

    private async resolveMaxTeamMembers(employerId: string): Promise<number> {
        const subscription = await this.prisma.employerSubscription.findUnique({
            where: { employerId },
            include: { package: true },
        });
        return subscription?.package?.maxTeamMembers ?? DEFAULT_MAX_TEAM_MEMBERS;
    }

    private parseRole(segment: string): EmployerMemberRole {
        const valid = Object.values(EmployerMemberRole) as string[];
        if (!valid.includes(segment)) {
            throw new BadRequestException('Invalid invite token: unrecognised role.');
        }
        return segment as EmployerMemberRole;
    }
}
