import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { Prisma } from "@prisma/client";

const SUGGESTION_SELECT = {
  text: true,
  type: true,
} satisfies Prisma.SearchSuggestionSelect;

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, limit = 6) {
    if (!q.trim()) return [];

    return this.prisma.searchSuggestion.findMany({
      where: {
        isActive: true,
        text: { contains: q, mode: Prisma.QueryMode.insensitive },
      },
      select: SUGGESTION_SELECT,
      take: limit,
      orderBy: { text: "asc" },
    });
  }
}
