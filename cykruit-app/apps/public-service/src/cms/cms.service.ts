import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { BlogQueryDto } from "./dto/blog-query.dto";
import { EventQueryDto } from "./dto/event-query.dto";

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

  async getEvents(dto: EventQueryDto) {
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

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          location: true,
          eventDate: true,
          bannerImage: true,
        },
        orderBy: {
          eventDate: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getEventBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return event;
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

  /** All active ads, keyed by slot — one call covers every AdSlot on a page. */
  async getActiveAds(): Promise<Record<string, { imageUrl: string; linkUrl: string; altText: string }>> {
    const ads = await this.prisma.ad.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      select: { slotKey: true, imageUrl: true, linkUrl: true, altText: true },
    });

    const bySlot: Record<string, { imageUrl: string; linkUrl: string; altText: string }> = {};
    for (const ad of ads) {
      // Already ordered by updatedAt desc, so the first hit per slot is the
      // most-recently-updated active ad — later duplicates are ignored.
      if (!bySlot[ad.slotKey]) {
        bySlot[ad.slotKey] = { imageUrl: ad.imageUrl, linkUrl: ad.linkUrl, altText: ad.altText };
      }
    }
    return bySlot;
  }
}
