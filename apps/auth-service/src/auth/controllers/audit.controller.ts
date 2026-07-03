// apps/auth-service/src/auth/controllers/audit.controller.ts
//
// Exposes the audit log to authenticated users.
// Users can only see their own audit log — no admin cross-user access here.
// (Admin audit log access should be in a separate admin controller)

import {
    Controller,
    Get,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    DefaultValuePipe,
    BadRequestException,
} from '@nestjs/common';
import { AuditService, AuditAction } from '@cykruit/audit';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    // GET /auth/audit-log?page=1&limit=20&action=LOGIN_FAILURE
    @Get('audit-log')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async getAuditLog(
        @CurrentUser() user: User,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('action') action?: string,
    ) {
        // Validate limit to prevent abuse
        if (limit > 100) {
            throw new BadRequestException({
                code: 'INVALID_LIMIT',
                message: 'Maximum 100 records per request.',
            });
        }

        if (page < 1) {
            throw new BadRequestException({
                code: 'INVALID_PAGE',
                message: 'Page must be >= 1.',
            });
        }

        // Validate action filter if provided
        let auditAction: AuditAction | undefined;
        if (action) {
            if (!Object.values(AuditAction).includes(action as AuditAction)) {
                throw new BadRequestException({
                    code: 'INVALID_ACTION',
                    message: `Invalid action filter. Valid actions: ${Object.values(AuditAction).join(', ')}`,
                });
            }
            auditAction = action as AuditAction;
        }

        const result = await this.auditService.getUserAuditLog(
            user.id,
            page,
            limit,
            auditAction,
        );

        return {
            data: result,
            message: `${result.logs.length} audit log entry(ies) found`,
        };
    }
}