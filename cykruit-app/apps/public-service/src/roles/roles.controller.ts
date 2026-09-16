import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkipRateLimit } from "@cykruit/rate-limit";
import { RolesService } from "./roles.service";
import { RolesSearchDto } from "./dto/roles-search.dto";
import { RolesListDto } from "./dto/roles-list.dto";

@ApiTags("roles")
@Controller("roles")
@Public()
@SkipRateLimit()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List job roles, optionally filtered by domain" })
  @ApiQuery({ name: "domainId", type: String, required: false })
  @ApiResponse({ status: 200, description: "List of roles." })
  async list(@Query() query: RolesListDto) {
    return this.rolesService.listRoles(query.domainId);
  }

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search job roles" })
  @ApiQuery({
    name: "q",
    type: String,
    description: "Search term for role name (e.g. security)",
    required: true,
  })
  @ApiResponse({ status: 200, description: "List of matching roles." })
  async search(@Query() query: RolesSearchDto) {
    return this.rolesService.searchRoles(query.q);
  }
}
