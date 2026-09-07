// admin-app/src/common/decorators/searchable.decorator.ts
// Marks a provider (typically a repository) as implementing ISearchEntity,
// so SearchService's DiscoveryService scan picks it up automatically —
// no manual registration anywhere else.

import { SetMetadata } from '@nestjs/common';

export const SEARCHABLE_METADATA_KEY = 'isSearchable';

export const Searchable = () => SetMetadata(SEARCHABLE_METADATA_KEY, true);
