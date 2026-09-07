// admin-app/src/modules/events/events.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma, Event } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { AdminEventsQueryDto, CreateEventDto, UpdateEventDto } from './dto/events.dto';

export interface PaginatedEventsResult {
    items: Event[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    metrics: {
        total: number;
        published: number;
        drafts: number;
        categories: number;
    };
}

@Searchable()
@Injectable()
export class EventsRepository implements ISearchEntity {
    readonly key = 'events';
    readonly label = 'Events';
    readonly action = ACTIONS.EVENTS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.event.findMany({
            where: { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
            select: { id: true, title: true },
            take,
        });
        return rows.map((e) => ({ id: e.id, title: e.title, subtitle: null, href: `/events/${e.id}` }));
    }

    async findAll(query: AdminEventsQueryDto): Promise<PaginatedEventsResult> {
        const { page = 1, limit = 10, search, category, isPublished } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.EventWhereInput = {
            ...(isPublished !== undefined ? { isPublished } : {}),
            ...(category && category !== 'ALL'
                ? { category: { equals: category, mode: Prisma.QueryMode.insensitive } }
                : {}),
            ...(search
                ? {
                      OR: [
                          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { location: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total, totalCount, publishedCount, categoriesDistinct] = await this.prisma.$transaction([
            this.prisma.event.findMany({
                where,
                skip,
                take: limit,
                orderBy: { eventDate: 'desc' },
            }),
            this.prisma.event.count({ where }),
            this.prisma.event.count(),
            this.prisma.event.count({ where: { isPublished: true } }),
            this.prisma.event.findMany({
                where: { category: { not: null } },
                select: { category: true },
                distinct: ['category'],
            }),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
            metrics: {
                total: totalCount,
                published: publishedCount,
                drafts: totalCount - publishedCount,
                categories: categoriesDistinct.length,
            },
        };
    }

    async findById(id: string): Promise<Event | null> {
        return this.prisma.event.findUnique({ where: { id } });
    }

    async findBySlug(slug: string): Promise<Event | null> {
        return this.prisma.event.findUnique({ where: { slug } });
    }

    async create(data: CreateEventDto & { slug: string }): Promise<Event> {
        return this.prisma.event.create({
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                content: data.content,
                category: data.category,
                location: data.location,
                eventDate: new Date(data.eventDate),
                bannerImage: data.bannerImage,
                isPublished: data.isPublished ?? false,
            },
        });
    }

    async update(id: string, data: UpdateEventDto): Promise<Event> {
        return this.prisma.event.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.slug !== undefined ? { slug: data.slug } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.content !== undefined ? { content: data.content } : {}),
                ...(data.category !== undefined ? { category: data.category } : {}),
                ...(data.location !== undefined ? { location: data.location } : {}),
                ...(data.eventDate !== undefined ? { eventDate: new Date(data.eventDate) } : {}),
                ...(data.bannerImage !== undefined ? { bannerImage: data.bannerImage } : {}),
                ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
            },
        });
    }

    async delete(id: string): Promise<Event> {
        return this.prisma.event.delete({ where: { id } });
    }

    async setPublished(id: string, isPublished: boolean): Promise<Event> {
        return this.prisma.event.update({
            where: { id },
            data: { isPublished },
        });
    }
}
