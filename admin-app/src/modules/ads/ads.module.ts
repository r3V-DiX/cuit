// admin-app/src/modules/ads/ads.module.ts

import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { AdsRepository } from './ads.repository';

@Module({
    controllers: [AdsController],
    providers: [AdsService, AdsRepository],
    exports: [AdsService, AdsRepository],
})
export class AdsModule {}
