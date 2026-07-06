import { Controller, Get, Query, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "@cykruit/auth-core";
import { SkillsService } from "./skills.service";
import { SkillsSearchDto } from "./dto/skills-search.dto";

@ApiTags("skills")
@Controller("skills")
@Public()
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search skills" })
  @ApiQuery({
    name: "q",
    type: String,
    description: "Search term for skill name",
    required: true,
  })
  @ApiQuery({
    name: "categoryId",
    type: String,
    description: "Category ID filter",
    required: false,
  })
  @ApiResponse({ status: 200, description: "List of matching skills." })
  async search(@Query() query: SkillsSearchDto) {
    return this.skillsService.searchSkills(query);
  }
}
