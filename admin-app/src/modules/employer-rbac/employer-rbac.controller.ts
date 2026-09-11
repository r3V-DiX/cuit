// admin-app/src/modules/employer-rbac/employer-rbac.controller.ts
// Admin CRUD over the employer team-role permission matrix (OWNER/HIRING_MANAGER/
// RECRUITER/VIEWER). Roles are a fixed enum here — no role create/delete, only
// editing which permissions each role grants.

import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    ParseEnumPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { EmployerMemberRole } from '@prisma/client';
import type { Admin } from '@prisma/client';
import { AdminAuthGuard } from '../auth';
import { CurrentAdmin } from '../auth';
import { PermissionsGuard } from '../../common';
import { RequirePermission } from '../../common';
import { ACTIONS } from '../../common';
import { EmployerRbacService } from './employer-rbac.service';
import { SetRoleGrantsDto } from './dto/employer-rbac.dto';

@Controller('admin/employer-rbac')
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class EmployerRbacController {
    constructor(private readonly service: EmployerRbacService) {}

    // GET /admin/employer-rbac/permissions
    @Get('permissions')
    @RequirePermission(ACTIONS.EMPLOYER_RBAC.VIEW)
    getMatrix() {
        return this.service.getMatrix();
    }

    // PATCH /admin/employer-rbac/roles/:role
    @Patch('roles/:role')
    @HttpCode(HttpStatus.OK)
    @RequirePermission(ACTIONS.EMPLOYER_RBAC.MANAGE)
    setRoleGrants(
        @CurrentAdmin() admin: Admin,
        @Param('role', new ParseEnumPipe(EmployerMemberRole)) role: EmployerMemberRole,
        @Body() dto: SetRoleGrantsDto,
    ) {
        return this.service.setRoleGrants(admin.id, role, dto);
    }
}
