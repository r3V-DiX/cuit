import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from './subscription.repository';
import { AdminNotificationModule } from '../admin-notifications';

@Module({
    imports: [AdminNotificationModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, SubscriptionRepository],
})
export class SubscriptionModule {}
