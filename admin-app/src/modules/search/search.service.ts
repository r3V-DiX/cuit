// admin-app/src/modules/search/search.service.ts
// Universal admin search: discovers every provider tagged @Searchable()
// (typically a feature's own repository) via NestJS's DiscoveryService,
// then fans a query out to each in parallel, capped to a handful of matches
// each. Adding a new searchable entity never touches this file — see
// admin-app/src/common/decorators/searchable.decorator.ts.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { PermissionsService, SEARCHABLE_METADATA_KEY, type ISearchEntity } from '../../common';

export interface SearchGroup {
    key: string;
    label: string;
    items: Awaited<ReturnType<ISearchEntity['search']>>;
}

@Injectable()
export class SearchService implements OnModuleInit {
    private readonly logger = new Logger(SearchService.name);
    private entities: ISearchEntity[] = [];

    constructor(
        private readonly discoveryService: DiscoveryService,
        private readonly reflector: Reflector,
        private readonly permissionsService: PermissionsService,
    ) {}

    onModuleInit(): void {
        this.entities = this.discoveryService
            .getProviders()
            .filter((wrapper) => wrapper.metatype && this.reflector.get(SEARCHABLE_METADATA_KEY, wrapper.metatype))
            .map((wrapper) => wrapper.instance as ISearchEntity)
            .filter((instance): instance is ISearchEntity => !!instance && typeof instance.search === 'function');

        this.logger.log(`Discovered ${this.entities.length} searchable entities: ${this.entities.map((e) => e.key).join(', ')}`);
    }

    async search(adminId: string, q: string): Promise<{ query: string; groups: SearchGroup[] }> {
        const resolved = await this.permissionsService.resolveUserPermissions(adminId);
        const visible = this.entities.filter(
            (entity) => resolved.isSuperAdmin || resolved.permissions.has(entity.action),
        );

        // Each entity queries an independent table — one failing/missing
        // table (e.g. a not-yet-applied migration) must not take down search
        // results for every other entity.
        const results = await Promise.all(
            visible.map(async (entity) => {
                try {
                    return { key: entity.key, label: entity.label, items: await entity.search(q, 5) };
                } catch (err) {
                    this.logger.error(`Search entity "${entity.key}" failed`, err instanceof Error ? err.stack : err);
                    return { key: entity.key, label: entity.label, items: [] };
                }
            }),
        );

        return { query: q, groups: results.filter((g) => g.items.length > 0) };
    }
}
