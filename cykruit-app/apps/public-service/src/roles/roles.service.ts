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
        domain: { select: { id: true, name: true, slug: true } },
      },
      take: 20,
    });
  }

  async listRoles(domainId?: string) {
    return this.prisma.role.findMany({
      where: {
        isActive: true,
        ...(domainId ? { domainId } : {}),
      },
      select: {
        id: true,
        name: true,
        domain: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { name: "asc" },
    });
  }
}
