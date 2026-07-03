// apps/seeker-profile-service/src/profile/controllers/profile.controller.ts

import {
    Controller, Get, Patch, Delete,
    Body, UseGuards, UseInterceptors,
    UploadedFile, ParseFilePipe,
    MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { SkipRateLimit } from '@cykruit/rate-limit';
import { ProfileService } from '../services/profile.service';
import { UpdateBasicInfoDto } from '../dto/update-basic-info.dto';
import { UpdateSummaryDto } from '../dto/update-summary.dto';

@Controller('profile')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.SEEKER)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    @SkipRateLimit()
    getProfile(@CurrentUser() user: User) {
        return this.profileService.getProfile(user.id);
    }

    @Patch('basic-info')
    updateBasicInfo(@CurrentUser() user: User, @Body() dto: UpdateBasicInfoDto) {
        return this.profileService.updateBasicInfo(user.id, dto);
    }

    @Patch('summary')
    updateSummary(@CurrentUser() user: User, @Body() dto: UpdateSummaryDto) {
        return this.profileService.updateSummary(user.id, dto);
    }

    @Patch('image')
    @UseInterceptors(FileInterceptor('file'))
    uploadProfileImage(
        @CurrentUser() user: User,
        @UploadedFile(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
            ],
        })) file: Express.Multer.File,
    ) {
        return this.profileService.uploadProfileImage(user.id, file);
    }

    @Delete('image')
    deleteProfileImage(@CurrentUser() user: User) {
        return this.profileService.deleteProfileImage(user.id);
    }

    @Get('completion')
    @SkipRateLimit()
    getProfileCompletion(@CurrentUser() user: User) {
        return this.profileService.getProfileCompletion(user.id);
    }
}