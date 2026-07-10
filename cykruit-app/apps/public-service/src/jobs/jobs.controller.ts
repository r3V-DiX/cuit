import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from "@nestjs/swagger";
import {
  Public,
  OptionalAuth,
  OptionalAuthGuard,
  CurrentUser,
} from "@cykruit/auth-core";
import { RateLimit } from "@cykruit/rate-limit";
import { User } from "@prisma/client";
import { JobsService } from "./jobs.service";
import { JobsQueryDto } from "./dto/jobs-query.dto";

@ApiTags("jobs")
@Controller("jobs")
@Public()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @RateLimit({ public_search: { ttl: 60_000, limit: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Browse all approved job listings" })
  @ApiResponse({ status: 200, description: "Paginated list of jobs." })
  async getJobs(@Query() query: JobsQueryDto) {
    return this.jobsService.getJobs(query);
  }

  @Get(":slug")
  @RateLimit({ public_search: { ttl: 60_000, limit: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get job details by slug" })
  @ApiParam({
    name: "slug",
    type: String,
    description: "The unique slug of the job",
  })
  @ApiResponse({ status: 200, description: "Full job details." })
  @ApiResponse({ status: 404, description: "Job not found." })
  async getJobBySlug(@Param("slug") slug: string) {
    return this.jobsService.getJobBySlug(slug);
  }

  @Post(":id/view")
  @RateLimit({ view_tracking: { ttl: 60_000, limit: 10 } })
  @OptionalAuth()
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Track job view" })
  @ApiParam({ name: "id", type: String, description: "The UUID of the job" })
  @ApiResponse({ status: 200, description: "Job view tracked successfully." })
  async trackView(@Param("id") jobId: string, @CurrentUser() user?: User) {
    // Fire and forget view tracking
    this.jobsService.trackJobView(jobId, user?.id).catch(() => null);
    return { success: true };
  }
}
