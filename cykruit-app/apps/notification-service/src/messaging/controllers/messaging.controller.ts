// apps/notification-service/src/messaging/controllers/messaging.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { MessagingService } from '../services/messaging.service';
import { SendMessageDto, StartConversationDto } from '../dto/messaging.dto';

@Controller('conversations')
@UseGuards(AuthGuard)
export class MessagingController {
    constructor(private readonly messagingService: MessagingService) {}

    // ── GET /conversations ────────────────────────────────────────────────────

    @Get()
    getConversations(@CurrentUser() user: User) {
        return this.messagingService.getConversations(user.id);
    }

    // ── GET /conversations/:id ────────────────────────────────────────────────

    @Get(':id')
    getConversation(@CurrentUser() user: User, @Param('id') id: string) {
        return this.messagingService.getConversation(user.id, id);
    }

    // ── POST /conversations ───────────────────────────────────────────────────

    @Post()
    startConversation(
        @CurrentUser() user: User,
        @Body() dto: StartConversationDto,
    ) {
        return this.messagingService.startConversation(user.id, dto.targetUserId, dto.jobId);
    }

    // ── POST /conversations/:id/messages ──────────────────────────────────────

    @Post(':id/messages')
    sendMessage(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() dto: SendMessageDto,
    ) {
        return this.messagingService.sendMessage(user.id, id, dto.content);
    }

    // ── PATCH /conversations/:id/read ─────────────────────────────────────────

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    markRead(@CurrentUser() user: User, @Param('id') id: string) {
        return this.messagingService.markRead(user.id, id);
    }

    // ── DELETE /conversations/:id/messages/:msgId ─────────────────────────────

    @Delete(':id/messages/:msgId')
    @HttpCode(HttpStatus.OK)
    deleteMessage(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Param('msgId') msgId: string,
    ) {
        return this.messagingService.deleteMessage(user.id, id, msgId);
    }
}
