import { Module } from '@nestjs/common';
import { BlacklistController } from './blacklist.controller';
import { BlacklistService } from './blacklist.service';
import { BlacklistRepository } from './blacklist.repository';

@Module({
    controllers: [BlacklistController],
    providers: [BlacklistService, BlacklistRepository],
})
export class BlacklistModule {}
