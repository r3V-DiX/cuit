import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountsRepository } from './discounts.repository';

@Module({
    controllers: [DiscountsController],
    providers: [DiscountsService, DiscountsRepository],
})
export class DiscountsModule {}
