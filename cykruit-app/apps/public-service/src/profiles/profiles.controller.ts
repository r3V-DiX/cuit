import { Controller, Get, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
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
  async getSeekerProfile(@Param("id") userId: string) {
    return this.profilesService.getSeekerProfile(userId);
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
