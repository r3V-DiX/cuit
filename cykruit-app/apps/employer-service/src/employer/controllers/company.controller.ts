// apps/employer-service/src/employer/controllers/company.controller.ts

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    ParseUUIDPipe,
    SetMetadata,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { AuthGuard, RolesGuard, CsrfGuard, Roles, CurrentUser } from '@cykruit/auth-core';
import { PermissionGuard, RequirePermission, ACTIONS } from '@cykruit/permissions';
import { KycVerifiedGuard, SKIP_KYC_CHECK_KEY } from '../guards/kyc-verified.guard';
import { CompanyService } from '../services/company.service';
import {
    CreateCompanyDto,
    UpdateCompanyBasicDto,
    UpdateCompanyAboutDto,
    UpdateCompanySocialDto,
    AddOfficeLocationDto,
    AddCompanyBenefitDto,
    RequestToJoinDto,
    ResolveJoinRequestDto,
} from '../dto/company.dto';

const SkipKycCheck = () => SetMetadata(SKIP_KYC_CHECK_KEY, true);

@Controller('employer/company')
@UseGuards(AuthGuard, RolesGuard, CsrfGuard, KycVerifiedGuard, PermissionGuard)
@Roles(UserRole.EMPLOYER)
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get('me')
    getMyCompany(@CurrentUser() user: User) {
        return this.companyService.getMyCompany(user.id);
    }

    @Post('setup')
    @HttpCode(HttpStatus.CREATED)
    setupCompany(@CurrentUser() user: User, @Body() dto: CreateCompanyDto, @Req() req: Request) {
        return this.companyService.setupCompany(user.id, dto, req.ip, req.headers['user-agent']);
    }

    @Patch('basic')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    updateBasic(@CurrentUser() user: User, @Body() dto: UpdateCompanyBasicDto, @Req() req: Request) {
        return this.companyService.updateBasic(user.id, dto, req.ip, req.headers['user-agent']);
    }

    @Patch('about')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    updateAbout(@CurrentUser() user: User, @Body() dto: UpdateCompanyAboutDto, @Req() req: Request) {
        return this.companyService.updateAbout(user.id, dto, req.ip, req.headers['user-agent']);
    }

    @Patch('social')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    updateSocial(@CurrentUser() user: User, @Body() dto: UpdateCompanySocialDto, @Req() req: Request) {
        return this.companyService.updateSocial(user.id, dto, req.ip, req.headers['user-agent']);
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
                    new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
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
                    new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp)$/ }),
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
    removeOfficeLocation(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
        return this.companyService.removeOfficeLocation(user.id, id);
    }

    @Post('benefits')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    addBenefit(@CurrentUser() user: User, @Body() dto: AddCompanyBenefitDto) {
        return this.companyService.addBenefit(user.id, dto);
    }

    @Delete('benefits/:id')
    @RequirePermission(ACTIONS.COMPANY.UPDATE)
    removeBenefit(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
        return this.companyService.removeBenefit(user.id, id);
    }

    // ── Join Request routes (all skip KYC — user hasn't verified yet) ────────

    /** GET /employer/company/domain-check — call after register to show the right screen */
    @Get('domain-check')
    @SkipKycCheck()
    domainCheck(@CurrentUser() user: User) {
        return this.companyService.checkDomain(user.id);
    }

    /** POST /employer/company/join-request — user requests to join their domain's company */
    @Post('join-request')
    @HttpCode(HttpStatus.CREATED)
    @SkipKycCheck()
    requestToJoin(@CurrentUser() user: User, @Body() dto: RequestToJoinDto) {
        return this.companyService.requestToJoin(user.id, dto.message);
    }

    /** GET /employer/company/join-request/me — poll own request status */
    @Get('join-request/me')
    @SkipKycCheck()
    getMyJoinRequest(@CurrentUser() user: User) {
        return this.companyService.getMyJoinRequest(user.id);
    }

    /** GET /employer/company/join-requests — OWNER/HM: list pending requests for their company */
    @Get('join-requests')
    @RequirePermission(ACTIONS.COMPANY.READ)
    getJoinRequests(@CurrentUser() user: User) {
        return this.companyService.getJoinRequests(user.id);
    }

    /** PATCH /employer/company/join-requests/resolve — accept or reject a request */
    @Patch('join-requests/resolve')
    @RequirePermission(ACTIONS.COMPANY.INVITE_MEMBER)
    resolveJoinRequest(@CurrentUser() user: User, @Body() dto: ResolveJoinRequestDto) {
        return this.companyService.resolveJoinRequest(user.id, dto.joinRequestId, dto.status);
    }
}
