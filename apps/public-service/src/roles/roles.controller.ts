import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { RolesService } from "./roles.service";
import { RolesSearchDto } from "./dto/roles-search.dto";

@ApiTags("roles")
@Controller("roles")
@Public()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

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
