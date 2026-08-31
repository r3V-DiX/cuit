// admin-app/src/modules/emails/emails.controller.ts

import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import type { Admin } from '@prisma/client';
import { AdminAuthGuard, CurrentAdmin } from '../auth';
import { ACTIONS, PermissionsGuard, RequirePermission } from '../../common';
import { EmailsService } from './emails.service';
import {
    CampaignListQueryDto,
    PreviewEmailDto,
    SendEmailCampaignDto,
    TestEmailDto,
} from './dto/emails.dto';

@Controller('admin/emails')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class EmailsController {
    constructor(private readonly emailsService: EmailsService) {}

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
