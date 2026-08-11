// admin-app/src/admin/controllers/admin-invite-accept.controller.ts
// Public endpoint — no admin session exists yet when someone is accepting an
// invite. Kept on its own guard-free controller (never merged into
// AdminsController) so a future change to that controller's @UseGuards can't
// accidentally lock this route down.
//
// Accepting an invite only activates the Admin row — it no longer sets a
// password or logs the admin in. They sign in afterward via email + OTP,
// same as every other admin.

import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '@cykruit/auth-core';
import { AdminsService } from './admins.service';
import { AcceptInviteDto } from './dto/admins.dto';

@Controller('admin/admins/invite')
export class AdminInviteAcceptController {
    constructor(private readonly adminsService: AdminsService) {}

    // POST /admin/admins/invite/accept
    @Public()
    @Post('accept')
    @HttpCode(HttpStatus.OK)
    async accept(@Body() dto: AcceptInviteDto, @Req() req: Request) {
        return this.adminsService.acceptInvite(dto, req.ip, req.headers['user-agent']);
    }
}
