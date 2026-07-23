import { Module } from '@nestjs/common';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsRepository } from './suggestions.repository';

@Module({
    controllers: [SuggestionsController],
    providers: [SuggestionsService, SuggestionsRepository],
})
export class SuggestionsModule {}
