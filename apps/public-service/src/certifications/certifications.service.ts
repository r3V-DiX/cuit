import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";

@Injectable()
export class CertificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCertifications(q: string) {
    return this.prisma.certification.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            organization: {
              contains: q,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        organization: true,
      },
      take: 20,
    });
  }
}
