import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { BlogQueryDto } from "./dto/blog-query.dto";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBlogPosts(dto: BlogQueryDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (dto.category) {
      where.category = {
        equals: dto.category,
        mode: "insensitive",
      };
    }

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.blog.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          coverImage: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.blog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getBlogPostBySlug(slug: string) {
    const post = await this.prisma.blog.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!post) {
      throw new NotFoundException("Blog post not found");
    }

    return post;
  }

  async getUpcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.event.findMany({
      where: {
        isPublished: true,
        eventDate: {
          gte: today,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        eventDate: true,
        bannerImage: true,
      },
      orderBy: {
        eventDate: "asc",
      },
    });
  }

  async getGalleryItems() {
    return this.prisma.galleryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
