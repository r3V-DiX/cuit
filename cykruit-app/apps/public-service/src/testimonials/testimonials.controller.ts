import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { TestimonialsService } from "./testimonials.service";
import { TestimonialsQueryDto } from "./dto/testimonials-query.dto";

@ApiTags("testimonials")
@Controller("testimonials")
@Public()
@SkipRateLimit()
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get published testimonials" })
  @ApiResponse({ status: 200, description: "List of testimonials." })
  async getTestimonials(@Query() query: TestimonialsQueryDto) {
    return this.testimonialsService.getTestimonials(query);
  }
}
