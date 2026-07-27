import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { LocationsService } from "./locations.service";
import { LocationSearchDto } from "./dto/locations-search.dto";

@ApiTags("locations")
@Controller("locations")
@Public()
@SkipRateLimit()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search locations" })
  @ApiQuery({
    name: "q",
    type: String,
    description: "Search term for location (city/state/country)",
    required: true,
  })
  @ApiResponse({ status: 200, description: "List of matching locations." })
  async search(@Query() query: LocationSearchDto) {
    return this.locationsService.searchLocations(query.q);
  }

  @Get("popular")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get popular locations" })
  @ApiResponse({ status: 200, description: "List of popular locations." })
  async getPopular() {
    return this.locationsService.getPopularLocations();
  }
}
