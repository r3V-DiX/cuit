// admin-app/src/modules/blogs/blogs.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma, Blog } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { AdminBlogsQueryDto, CreateBlogDto, UpdateBlogDto } from './dto/blogs.dto';

export interface PaginatedBlogsResult {
    items: Blog[];
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
export class BlogsRepository implements ISearchEntity {
    readonly key = 'blogs';
    readonly label = 'Blogs';
    readonly action = ACTIONS.BLOGS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.blog.findMany({
            where: { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
            select: { id: true, title: true },
            take,
        });
        return rows.map((b) => ({ id: b.id, title: b.title, subtitle: null, href: `/blogs/${b.id}` }));
    }

    async findAll(query: AdminBlogsQueryDto): Promise<PaginatedBlogsResult> {
        const { page = 1, limit = 10, search, category, isPublished } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BlogWhereInput = {
            ...(isPublished !== undefined ? { isPublished } : {}),
            ...(category && category !== 'ALL'
                ? { category: { equals: category, mode: Prisma.QueryMode.insensitive } }
                : {}),
            ...(search
                ? {
                      OR: [
                          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { excerpt: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
                      ],
                  }
                : {}),
        };

        const [items, total, totalCount, publishedCount, categoriesDistinct] = await this.prisma.$transaction([
            this.prisma.blog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.blog.count({ where }),
            this.prisma.blog.count(),
            this.prisma.blog.count({ where: { isPublished: true } }),
            this.prisma.blog.findMany({
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

    async findById(id: string): Promise<Blog | null> {
        return this.prisma.blog.findUnique({ where: { id } });
    }

    async findBySlug(slug: string): Promise<Blog | null> {
        return this.prisma.blog.findUnique({ where: { slug } });
    }

    async create(data: CreateBlogDto & { slug: string }): Promise<Blog> {
        return this.prisma.blog.create({
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                content: data.content,
                category: data.category,
                coverImage: data.coverImage,
                isPublished: data.isPublished ?? false,
            },
        });
    }

    async update(id: string, data: UpdateBlogDto): Promise<Blog> {
        return this.prisma.blog.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.slug !== undefined ? { slug: data.slug } : {}),
                ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
                ...(data.content !== undefined ? { content: data.content } : {}),
                ...(data.category !== undefined ? { category: data.category } : {}),
                ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
                ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
            },
        });
    }

    async delete(id: string): Promise<Blog> {
        return this.prisma.blog.delete({ where: { id } });
    }

    async setPublished(id: string, isPublished: boolean): Promise<Blog> {
        return this.prisma.blog.update({
            where: { id },
            data: { isPublished },
        });
    }
}
