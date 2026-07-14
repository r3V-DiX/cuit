import { Controller, Get, Param, HttpCode, HttpStatus, ParseUUIDPipe, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { Public, OptionalAuthGuard, CurrentUser } from "@cykruit/auth-core";
import { RateLimit } from "@cykruit/rate-limit";
import type { User } from "@prisma/client";
import { ProfilesService } from "./profiles.service";

@ApiTags("profiles")
@Controller()
@Public()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get("u/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get public seeker portfolio" })
  @ApiParam({
    name: "id",
    type: String,
    description: "The user UUID of the job seeker",
  })
  @ApiResponse({
    status: 200,
    description: "Public profile details (anonymized if set to anonymous).",
  })
  @ApiResponse({
    status: 404,
    description: "Profile not found or set to private.",
  })
  @RateLimit({ public_search: { ttl: 60_000, limit: 30 } })
  @UseGuards(OptionalAuthGuard)
  async getSeekerProfile(
    @Param("id", ParseUUIDPipe) userId: string,
    @Req() req: Request,
    @CurrentUser() user?: User
  ) {
    return this.profilesService.getSeekerProfile(userId, {
      viewerId: user?.id,
      ip: req.ip || req.headers["x-forwarded-for"]?.toString(),
      userAgent: req.headers["user-agent"]
    });
  }

  @Get("company/:slug")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get public company profile" })
  @ApiParam({
    name: "slug",
    type: String,
    description: "The unique slug of the company",
  })
  @ApiResponse({ status: 200, description: "Company profile details." })
  @ApiResponse({ status: 404, description: "Company not found or incomplete." })
  async getCompanyProfile(@Param("slug") slug: string) {
    return this.profilesService.getCompanyProfile(slug);
  }
}
