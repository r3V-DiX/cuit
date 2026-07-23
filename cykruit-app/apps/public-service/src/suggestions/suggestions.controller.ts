import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SuggestionsService } from "./suggestions.service";

@ApiTags("suggestions")
@Controller("suggestions")
@Public()
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search active suggestions for autocomplete" })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiResponse({ status: 200, description: "Matching active suggestions." })
  async search(@Query("q") q = "", @Query("limit") limit?: string) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 6, 20) : 6;
    return this.suggestionsService.search(q, parsedLimit);
  }
}
