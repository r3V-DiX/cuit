// apps/employer-service/src/employer/controllers/kyc.controller.ts

import {
    Controller,
    Get,
    Post,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '@prisma/client';
import { AuthGuard, CsrfGuard, CurrentUser } from '@cykruit/auth-core';
import { KycService } from '../services/kyc.service';
import { KycFileValidator } from '../validators/kyc-file.validator';

/** Maximum KYC document size: 10 MB (matches UPLOAD_CONFIGS.KYC_DOCUMENT) */
const KYC_MAX_FILE_SIZE = 10 * 1024 * 1024;

@Controller('employer/kyc')
@UseGuards(AuthGuard, CsrfGuard)
export class KycController {
    constructor(private readonly kycService: KycService) {}

    // ─── GET /employer/kyc/status ─────────────────────────────────────────────

    @Get('status')
    getStatus(@CurrentUser() user: User) {
        return this.kycService.getStatus(user.id);
    }

    // ─── GET /employer/kyc/history ────────────────────────────────────────────

    @Get('history')
    getHistory(@CurrentUser() user: User) {
        return this.kycService.getHistory(user.id);
    }

    // ─── POST /employer/kyc/submit ────────────────────────────────────────────

    @Post('submit')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    submit(
        @CurrentUser() user: User,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: KYC_MAX_FILE_SIZE }),
                    new KycFileValidator(),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.kycService.submit(user.id, file);
    }

    // ─── POST /employer/kyc/resubmit ──────────────────────────────────────────

    @Post('resubmit')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    resubmit(
        @CurrentUser() user: User,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: KYC_MAX_FILE_SIZE }),
                    new KycFileValidator(),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.kycService.resubmit(user.id, file);
    }
}
