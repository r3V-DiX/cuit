import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { CertificationsService } from "./certifications.service";
import { CertificationsSearchDto } from "./dto/certifications-search.dto";

@ApiTags("certifications")
@Controller("certifications")
@Public()
@SkipRateLimit()
export class CertificationsController {
  constructor(private readonly certsService: CertificationsService) {}

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search certifications" })
  @ApiQuery({
    name: "q",
    type: String,
    description: "Search term for certification name or organization",
    required: true,
  })
  @ApiResponse({ status: 200, description: "List of matching certifications." })
  async search(@Query() query: CertificationsSearchDto) {
    return this.certsService.searchCertifications(query.q);
  }
}
