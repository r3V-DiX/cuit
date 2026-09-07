import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    imports: [DiscoveryModule],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule {}
