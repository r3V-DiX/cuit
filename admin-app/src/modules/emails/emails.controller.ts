// admin-app/src/modules/emails/emails.controller.ts

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Delete,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import type { Admin } from '@prisma/client';
import { AdminAuthGuard, CurrentAdmin } from '../auth';
import { ACTIONS, PermissionsGuard, RequirePermission } from '../../common';
import { EmailsService } from './emails.service';
import { ResendAdminService, ResendLogQueryDto } from './resend.service';
import {
    CampaignListQueryDto,
    PreviewEmailDto,
    SendEmailCampaignDto,
    TestEmailDto,
} from './dto/emails.dto';

@Controller('admin/emails')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class EmailsController {
    constructor(
        private readonly emailsService: EmailsService,
        private readonly resendAdminService: ResendAdminService,
    ) {}

    // GET /admin/emails/resend/logs
    @Get('resend/logs')
    @RequirePermission(ACTIONS.EMAILS.VIEW)
    listResendLogs(@Query() query: ResendLogQueryDto) {
        return this.resendAdminService.listEmails(query);
    }

    // GET /admin/emails/resend/logs/:id
    @Get('resend/logs/:id')
    @RequirePermission(ACTIONS.EMAILS.VIEW)
    getResendEmail(@Param('id') id: string) {
        return this.resendAdminService.getEmailDetails(id);
    }

    // GET /admin/emails/resend/suppressions
    @Get('resend/suppressions')
    @RequirePermission(ACTIONS.EMAILS.VIEW)
    listResendSuppressions() {
        return this.resendAdminService.listSuppressions();
    }

    // DELETE /admin/emails/resend/suppressions/:email
    @Delete('resend/suppressions/:email')
    @RequirePermission(ACTIONS.EMAILS.SEND)
    removeResendSuppression(@Param('email') email: string) {
        return this.resendAdminService.removeSuppression(email);
    }

    // GET /admin/emails/campaigns
    @Get('campaigns')
    @RequirePermission(ACTIONS.EMAILS.VIEW)
    listCampaigns(@Query() query: CampaignListQueryDto) {
        return this.emailsService.list(query);
    }

    // GET /admin/emails/campaigns/:id
    @Get('campaigns/:id')
    @RequirePermission(ACTIONS.EMAILS.VIEW)
    getCampaign(@Param('id') id: string) {
        return this.emailsService.getById(id);
    }

    // POST /admin/emails/preview
    @Post('preview')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EMAILS.VIEW)
    previewEmail(@Body() dto: PreviewEmailDto) {
        return this.emailsService.preview(dto);
    }

    // POST /admin/emails/test
    @Post('test')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EMAILS.SEND)
    sendTestEmail(@CurrentAdmin() admin: Admin, @Body() dto: TestEmailDto) {
        return this.emailsService.sendTest(admin.id, dto);
    }

    // POST /admin/emails/send
    @Post('send')
    @HttpCode(HttpStatus.ACCEPTED)
    @RequirePermission(ACTIONS.EMAILS.SEND)
    sendCampaign(@CurrentAdmin() admin: Admin, @Body() dto: SendEmailCampaignDto) {
        return this.emailsService.createAndSendCampaign(admin.id, dto);
    }
}
