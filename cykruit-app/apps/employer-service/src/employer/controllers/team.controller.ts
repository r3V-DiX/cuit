// apps/employer-service/src/employer/controllers/team.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import { TeamService } from '../services/team.service';
import {
    InviteMemberDto,
    UpdateMemberRoleDto,
    TransferOwnershipDto,
    AcceptInviteDto,
} from '../dto/team.dto';

@Controller('employer/team')
@UseGuards(AuthGuard, PermissionGuard)
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
    inviteMember(@CurrentUser() user: User, @Body() dto: InviteMemberDto) {
        return this.teamService.inviteMember(user.id, dto);
    }

    /**
     * POST /employer/team/accept-invite
     * Accepts a pending invitation using the raw token from the invite link.
     * The user must be authenticated (they register first if they don't have an account).
     */
    @Post('accept-invite')
    @HttpCode(HttpStatus.CREATED)
    acceptInvite(@CurrentUser() user: User, @Body() dto: AcceptInviteDto) {
        return this.teamService.acceptInvite(user.id, dto.token);
    }

    /**
     * PATCH /employer/team/role
     * Updates a member's role. OWNER only.
     */
    @Patch('role')
    @RequirePermission(ACTIONS.COMPANY.CHANGE_ROLE)
    updateMemberRole(@CurrentUser() user: User, @Body() dto: UpdateMemberRoleDto) {
        return this.teamService.updateMemberRole(user.id, dto);
    }

    /**
     * POST /employer/team/transfer-ownership
     * Transfers company ownership to another member. OWNER only.
     */
    @Post('transfer-ownership')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.COMPANY.TRANSFER_OWNER)
    transferOwnership(@CurrentUser() user: User, @Body() dto: TransferOwnershipDto) {
        return this.teamService.transferOwnership(user.id, dto);
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
    ) {
        return this.teamService.removeMember(user.id, memberId);
    }
}
