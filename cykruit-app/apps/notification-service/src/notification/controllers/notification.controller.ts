// apps/notification-service/src/notification/controllers/notification.controller.ts

import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';
import { NotificationService } from '../services/notification.service';
import { WsTokenService } from '../services/ws-token.service';
import { NotificationListQueryDto } from '../dto/notification-query.dto';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly wsTokenService: WsTokenService,
    ) {}

    // ── GET /notifications ────────────────────────────────────────────────────

    @Get()
    list(@CurrentUser() user: User, @Query() query: NotificationListQueryDto) {
        return this.notificationService.list(user.id, query);
    }

    // ── GET /notifications/unread-count ───────────────────────────────────────

    @Get('unread-count')
    unreadCount(@CurrentUser() user: User) {
        return this.notificationService.getUnreadCount(user.id);
    }

    // ── GET /ws/token — WebSocket auth token ──────────────────────────────────

    @Get('/ws/token')
    wsToken(@CurrentUser() user: User) {
        return this.wsTokenService.issueToken(user);
    }

    // ── PATCH /notifications/:id/read ─────────────────────────────────────────

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    markRead(@CurrentUser() user: User, @Param('id') id: string) {
        return this.notificationService.markRead(user.id, id);
    }

    // ── PATCH /notifications/read-all ─────────────────────────────────────────

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    markAllRead(@CurrentUser() user: User) {
        return this.notificationService.markAllRead(user.id);
    }

    // ── DELETE /notifications/:id ─────────────────────────────────────────────

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    deleteOne(@CurrentUser() user: User, @Param('id') id: string) {
        return this.notificationService.deleteOne(user.id, id);
    }
}
