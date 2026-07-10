// apps/employer-service/src/employer/dto/team.dto.ts

import { IsEmail, IsEnum, IsString, IsUUID, MaxLength, NotEquals } from 'class-validator';
import { EmployerMemberRole } from '@prisma/client';

export class InviteMemberDto {
    @IsEmail()
    email: string;

    @IsEnum(EmployerMemberRole)
    @NotEquals(EmployerMemberRole.OWNER, {
        message: 'Cannot directly invite a member as OWNER. Use transfer-ownership instead.',
    })
    role: EmployerMemberRole;
}

export class UpdateMemberRoleDto {
    @IsUUID()
    memberId: string;

    @IsEnum(EmployerMemberRole)
    @NotEquals(EmployerMemberRole.OWNER, {
        message: 'Cannot set role to OWNER directly. Use transfer-ownership instead.',
    })
    newRole: EmployerMemberRole;
}

export class TransferOwnershipDto {
    @IsUUID()
    newOwnerMemberId: string;

    @IsEnum(EmployerMemberRole)
    @NotEquals(EmployerMemberRole.OWNER, {
        message: 'currentOwnerNewRole cannot be OWNER.',
    })
    currentOwnerNewRole: EmployerMemberRole;
}

export class AcceptInviteDto {
    @IsString()
    @MaxLength(500)
    token: string;
}
