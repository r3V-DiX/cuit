import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async searchRoles(q: string) {
    return this.prisma.role.findMany({
      where: {
        isActive: true,
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
      take: 20,
    });
  }
}
