import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { AnnouncementTarget } from "@prisma/client";
import { AnnouncementsService } from "./announcements.service";

@ApiTags("announcements")
@Controller("announcements")
@Public()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get active announcements for a target audience" })
  @ApiQuery({ name: "target", enum: AnnouncementTarget, required: false })
  @ApiResponse({ status: 200, description: "List of active announcements." })
  async getAnnouncements(@Query("target") target?: AnnouncementTarget) {
    return this.announcementsService.getActive(target);
  }
}
