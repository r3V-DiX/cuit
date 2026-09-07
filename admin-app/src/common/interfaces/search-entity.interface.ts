// admin-app/src/common/interfaces/search-entity.interface.ts

import type { Action } from '../rbac/permissions.registry';

export interface SearchResultItem {
    id: string;
    title: string;
    subtitle: string | null;
    href: string;
}

/**
 * Implemented directly on a feature's existing repository (or service) and
 * marked with @Searchable(). SearchService discovers these automatically —
 * see admin-app/src/modules/search/search.service.ts.
 */
export interface ISearchEntity {
    readonly key: string;
    readonly label: string;
    readonly action: Action;
    search(q: string, take: number): Promise<SearchResultItem[]>;
}
