// admin-app/src/modules/suggestions/suggestions.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { Prisma, SuggestionType } from '@prisma/client';
import { ACTIONS, Searchable, type ISearchEntity, type SearchResultItem } from '../../common';
import { SuggestionEntryDto, SuggestionListQueryDto, UpdateSuggestionDto } from './dto/suggestions.dto';

const SUGGESTION_SELECT = {
    id: true,
    text: true,
    type: true,
    isActive: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.SearchSuggestionSelect;

@Searchable()
@Injectable()
export class SuggestionsRepository implements ISearchEntity {
    readonly key = 'suggestions';
    readonly label = 'Search Suggestions';
    readonly action = ACTIONS.SUGGESTIONS.VIEW;

    constructor(private readonly prisma: PrismaService) {}

    async search(q: string, take: number): Promise<SearchResultItem[]> {
        const rows = await this.prisma.searchSuggestion.findMany({
            where: { text: { contains: q, mode: Prisma.QueryMode.insensitive } },
            select: { id: true, text: true, type: true },
            take,
        });
        return rows.map((s) => ({
            id: s.id,
            title: s.text,
            subtitle: s.type,
            href: `/suggestions?q=${encodeURIComponent(s.text)}`,
        }));
    }

    async findAll(query: SuggestionListQueryDto) {
        const { page = 1, limit = 20, type, isActive, q } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.SearchSuggestionWhereInput = {
            ...(type ? { type: type as SuggestionType } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
            ...(q ? { text: { contains: q, mode: Prisma.QueryMode.insensitive } } : {}),
        };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.searchSuggestion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: SUGGESTION_SELECT,
            }),
            this.prisma.searchSuggestion.count({ where }),
        ]);

        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    async findById(id: string) {
        return this.prisma.searchSuggestion.findUnique({ where: { id }, select: SUGGESTION_SELECT });
    }

    async create(adminId: string, entry: SuggestionEntryDto) {
        return this.prisma.searchSuggestion.create({
            data: {
                text: entry.text.trim(),
                type: entry.type as SuggestionType,
                createdBy: adminId,
            },
            select: SUGGESTION_SELECT,
        });
    }

    async bulkCreate(adminId: string, entries: SuggestionEntryDto[]) {
        return this.prisma.searchSuggestion.createMany({
            data: entries.map((entry) => ({
                text: entry.text.trim(),
                type: entry.type as SuggestionType,
                createdBy: adminId,
            })),
            skipDuplicates: true,
        });
    }

    async update(id: string, dto: UpdateSuggestionDto) {
        return this.prisma.searchSuggestion.update({
            where: { id },
            data: {
                ...(dto.text !== undefined ? { text: dto.text.trim() } : {}),
                ...(dto.type !== undefined ? { type: dto.type as SuggestionType } : {}),
            },
            select: SUGGESTION_SELECT,
        });
    }

    async setActive(id: string, isActive: boolean) {
        return this.prisma.searchSuggestion.update({
            where: { id },
            data: { isActive },
            select: SUGGESTION_SELECT,
        });
    }

    async delete(id: string) {
        return this.prisma.searchSuggestion.delete({ where: { id } });
    }
}
