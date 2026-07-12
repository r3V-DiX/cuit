// apps/auth-service/src/auth/controllers/admin-audit.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@cykruit/auth-core";
import { AdminGuard } from "../guards/admin.guard";
import { AdminAuditService } from "../services/admin-audit.service";
import { AdminAuditQueryDto } from "../dto/admin-audit.dto";

@Controller("auth/admin/audit-logs")
@UseGuards(AuthGuard, AdminGuard)
export class AdminAuditController {
  constructor(private readonly adminAuditService: AdminAuditService) {}

  @Get("auth")
  @HttpCode(HttpStatus.OK)
  async getAuthLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminAuditService.getAuthLogs(query);
  }

  @Get("system")
  @HttpCode(HttpStatus.OK)
  async getSystemLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminAuditService.getSystemLogs(query);
  }

  @Get("admin-activity")
  @HttpCode(HttpStatus.OK)
  async getAdminActivityLogs(@Query() query: AdminAuditQueryDto) {
    return this.adminAuditService.getAdminActivityLogs(query);
  }
}
