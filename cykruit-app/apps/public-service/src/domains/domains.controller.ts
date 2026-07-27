import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { DomainsService } from "./domains.service";

@ApiTags("domains")
@Controller("domains")
@Public()
@SkipRateLimit()
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get active job domains, for job-search filter facets" })
  @ApiResponse({ status: 200, description: "List of active job domains." })
  async getDomains() {
    return this.domainsService.getActive();
  }
}
