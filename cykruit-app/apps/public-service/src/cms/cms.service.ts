import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@cykruit/prisma";
import { UploadService } from "@cykruit/upload";
import { BlogQueryDto } from "./dto/blog-query.dto";
import { EventQueryDto } from "./dto/event-query.dto";

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

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
        bySlot[ad.slotKey] = {
          imageUrl: (await this.uploadService.convertToPresignedUrl(ad.imageUrl)) ?? ad.imageUrl,
          linkUrl: ad.linkUrl,
          altText: ad.altText,
        };
      }
    }
    return bySlot;
  }

  /** All active ads for one slot, undeduped — used by carousel-style slots that show multiple cards. */
  async getAdsBySlot(
    slotKey: string,
  ): Promise<{ id: string; imageUrl: string; linkUrl: string; altText: string }[]> {
    const ads = await this.prisma.ad.findMany({
      where: { slotKey, isActive: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, imageUrl: true, linkUrl: true, altText: true },
    });
    return Promise.all(
      ads.map(async (ad) => ({
        ...ad,
        imageUrl: (await this.uploadService.convertToPresignedUrl(ad.imageUrl)) ?? ad.imageUrl,
      })),
    );
  }

  /** Single ad by id — backs the /ads/:id interstitial redirect page. */
  async getAdById(
    id: string,
  ): Promise<{ id: string; imageUrl: string; linkUrl: string; altText: string; slotKey: string }> {
    const ad = await this.prisma.ad.findFirst({
      where: { id, isActive: true },
      select: { id: true, imageUrl: true, linkUrl: true, altText: true, slotKey: true },
    });

    if (!ad) {
      throw new NotFoundException("Ad not found");
    }

    return {
      ...ad,
      imageUrl: (await this.uploadService.convertToPresignedUrl(ad.imageUrl)) ?? ad.imageUrl,
    };
  }
}
