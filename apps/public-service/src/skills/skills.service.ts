import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { SkillsSearchDto } from "./dto/skills-search.dto";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSkills(dto: SkillsSearchDto) {
    const where: any = {
      isVerified: true,
      name: {
        contains: dto.q,
        mode: "insensitive",
      },
    };

    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }

    const results = await this.prisma.skill.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 20,
    });

    // Format to return { id, name, categoryName: category.name }
    return results.map((skill) => ({
      id: skill.id,
      name: skill.name,
      categoryName: skill.category?.name || null,
    }));
  }
}
