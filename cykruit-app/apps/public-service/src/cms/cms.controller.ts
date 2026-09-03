import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { CmsService } from "./cms.service";
import { BlogQueryDto } from "./dto/blog-query.dto";
import { EventQueryDto } from "./dto/event-query.dto";

@ApiTags("cms")
@Controller()
@Public()
@SkipRateLimit()
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get("blog")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get paginated blog posts" })
  @ApiQuery({
    name: "category",
    type: String,
    required: false,
    description: "Filter by category",
  })
  @ApiQuery({
    name: "page",
    type: Number,
    required: false,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    type: Number,
    required: false,
    description: "Items per page",
  })
  @ApiResponse({ status: 200, description: "Paginated list of blog posts." })
  async getBlogPosts(@Query() query: BlogQueryDto) {
    return this.cmsService.getBlogPosts(query);
  }

  @Get("blog/:slug")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get full blog post by slug" })
  @ApiParam({ name: "slug", type: String, description: "Post slug" })
  @ApiResponse({ status: 200, description: "Blog post details." })
  @ApiResponse({ status: 404, description: "Blog post not found." })
  async getBlogPostBySlug(@Param("slug") slug: string) {
    return this.cmsService.getBlogPostBySlug(slug);
  }

  @Get("events")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get paginated events" })
  @ApiQuery({
    name: "category",
    type: String,
    required: false,
    description: "Filter by category",
  })
  @ApiQuery({
    name: "page",
    type: Number,
    required: false,
    description: "Page number",
  })
  @ApiQuery({
    name: "limit",
    type: Number,
    required: false,
    description: "Items per page",
  })
  @ApiResponse({ status: 200, description: "Paginated list of events." })
  async getEvents(@Query() query: EventQueryDto) {
    return this.cmsService.getEvents(query);
  }

  @Get("events/:slug")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get full event by slug" })
  @ApiParam({ name: "slug", type: String, description: "Event slug" })
  @ApiResponse({ status: 200, description: "Event details." })
  @ApiResponse({ status: 404, description: "Event not found." })
  async getEventBySlug(@Param("slug") slug: string) {
    return this.cmsService.getEventBySlug(slug);
  }

  @Get("gallery")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get active gallery items" })
  @ApiResponse({ status: 200, description: "List of active gallery items." })
  async getGallery() {
    return this.cmsService.getGalleryItems();
  }

  @Get("ads")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get all active ads keyed by slot" })
  @ApiResponse({ status: 200, description: "Map of slotKey to ad creative." })
  async getAds() {
    return this.cmsService.getActiveAds();
  }
}
