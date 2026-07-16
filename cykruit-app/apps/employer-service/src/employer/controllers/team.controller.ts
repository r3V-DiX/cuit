// apps/employer-service/src/employer/controllers/team.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import { TeamService } from '../services/team.service';
import {
    InviteMemberDto,
    UpdateMemberRoleDto,
    TransferOwnershipDto,
    AcceptInviteDto,
} from '../dto/team.dto';
import { KycVerifiedGuard, SKIP_KYC_CHECK_KEY } from '../guards/kyc-verified.guard';
import { SetMetadata } from '@nestjs/common';

const SkipKycCheck = () => SetMetadata(SKIP_KYC_CHECK_KEY, true);

@Controller('employer/team')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard, KycVerifiedGuard, PermissionGuard)
@Roles(UserRole.EMPLOYER)
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    /**
     * GET /employer/team
     * Returns all team members for the authenticated user's company.
     */
    @Get()
    @RequirePermission(ACTIONS.COMPANY.READ)
    getTeam(@CurrentUser() user: User) {
        return this.teamService.getTeam(user.id);
    }

    /**
     * POST /employer/team/invite
     * Sends an email invitation to join the company. OWNER or HIRING_MANAGER only.
     */
    @Post('invite')
    @HttpCode(HttpStatus.CREATED)
    @RequirePermission(ACTIONS.COMPANY.INVITE_MEMBER)
    inviteMember(@CurrentUser() user: User, @Body() dto: InviteMemberDto, @Req() req: Request) {
        return this.teamService.inviteMember(user.id, dto, req.ip, req.headers['user-agent']);
    }

    /**
     * GET /employer/team/invite-preview?token=...
     * Returns invite metadata (company name, role, expiry) without consuming the token.
     * Used by the accept-invite UI to show a confirmation screen before committing.
     */
    @Get('invite-preview')
    @SkipKycCheck()
    previewInvite(@Query('token') token: string) {
        return this.teamService.previewInvite(token);
    }

    /**
     * POST /employer/team/accept-invite
     * Accepts a pending invitation using the raw token from the invite link.
     * The user must be authenticated (they register first if they don't have an account).
     */
    @Post('accept-invite')
    @HttpCode(HttpStatus.CREATED)
    @SkipKycCheck()
    acceptInvite(@CurrentUser() user: User, @Body() dto: AcceptInviteDto) {
        return this.teamService.acceptInvite(user.id, dto.token);
    }

    /**
     * PATCH /employer/team/role
     * Updates a member's role. OWNER only.
     */
    @Patch('role')
    @RequirePermission(ACTIONS.COMPANY.CHANGE_ROLE)
    updateMemberRole(@CurrentUser() user: User, @Body() dto: UpdateMemberRoleDto, @Req() req: Request) {
        return this.teamService.updateMemberRole(user.id, dto, req.ip, req.headers['user-agent']);
    }

    /**
     * POST /employer/team/transfer-ownership
     * Transfers company ownership to another member. OWNER only.
     */
    @Post('transfer-ownership')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.COMPANY.TRANSFER_OWNER)
    transferOwnership(@CurrentUser() user: User, @Body() dto: TransferOwnershipDto, @Req() req: Request) {
        return this.teamService.transferOwnership(user.id, dto, req.ip, req.headers['user-agent']);
    }

    /**
     * DELETE /employer/team/:memberId
     * Removes a member from the company. OWNER or HIRING_MANAGER only.
     */
    @Delete(':memberId')
    @RequirePermission(ACTIONS.COMPANY.REMOVE_MEMBER)
    removeMember(
        @CurrentUser() user: User,
        @Param('memberId', ParseUUIDPipe) memberId: string,
        @Req() req: Request,
    ) {
        return this.teamService.removeMember(user.id, memberId, req.ip, req.headers['user-agent']);
    }
}
