// apps/employer-service/src/employer/controllers/company.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '@prisma/client';
import { AuthGuard, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import { CompanyService } from '../services/company.service';
import {
    CreateCompanyDto,
    UpdateCompanyBasicDto,
    UpdateCompanyAboutDto,
    UpdateCompanySocialDto,
    AddOfficeLocationDto,
    AddCompanyBenefitDto,
} from '../dto/company.dto';

@Controller('employer/company')
@UseGuards(AuthGuard, PermissionGuard)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get('me')
    getMyCompany(@CurrentUser() user: User) {
        return this.companyService.getMyCompany(user.id);
    }

    @Post('setup')
    @HttpCode(HttpStatus.CREATED)
    setupCompany(@CurrentUser() user: User, @Body() dto: CreateCompanyDto) {
        return this.companyService.setupCompany(user.id, dto);
    }

    @Patch('basic')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    updateBasic(@CurrentUser() user: User, @Body() dto: UpdateCompanyBasicDto) {
        return this.companyService.updateBasic(user.id, dto);
    }

    @Patch('about')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    updateAbout(@CurrentUser() user: User, @Body() dto: UpdateCompanyAboutDto) {
        return this.companyService.updateAbout(user.id, dto);
    }

    @Patch('social')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    updateSocial(@CurrentUser() user: User, @Body() dto: UpdateCompanySocialDto) {
        return this.companyService.updateSocial(user.id, dto);
    }

    @Post('logo')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    @UseInterceptors(FileInterceptor('file'))
    uploadLogo(
        @CurrentUser() user: User,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.companyService.uploadLogo(user.id, file);
    }

    @Post('banner')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    @UseInterceptors(FileInterceptor('file'))
    uploadBanner(
        @CurrentUser() user: User,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.companyService.uploadBanner(user.id, file);
    }

    @Post('locations')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    addOfficeLocation(@CurrentUser() user: User, @Body() dto: AddOfficeLocationDto) {
        return this.companyService.addOfficeLocation(user.id, dto);
    }

    @Delete('locations/:id')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    removeOfficeLocation(@CurrentUser() user: User, @Param('id') id: string) {
        return this.companyService.removeOfficeLocation(user.id, id);
    }

    @Post('benefits')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    addBenefit(@CurrentUser() user: User, @Body() dto: AddCompanyBenefitDto) {
        return this.companyService.addBenefit(user.id, dto);
    }

    @Delete('benefits/:id')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    removeBenefit(@CurrentUser() user: User, @Param('id') id: string) {
        return this.companyService.removeBenefit(user.id, id);
    }
}
