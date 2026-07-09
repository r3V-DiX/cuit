import { Injectable } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { TestimonialsQueryDto } from "./dto/testimonials-query.dto";

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTestimonials(dto: TestimonialsQueryDto) {
    const where: any = { isPublished: true };
    if (dto.type) where.type = dto.type;

    return this.prisma.testimonial.findMany({
      where,
      select: {
        id: true,
        type: true,
        name: true,
        role: true,
        company: true,
        avatar: true,
        avatarColor: true,
        quote: true,
        stars: true,
        tag: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }
}
