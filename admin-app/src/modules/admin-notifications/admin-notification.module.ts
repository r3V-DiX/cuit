import { Module } from '@nestjs/common';
import { AdminNotificationController } from './admin-notification.controller';
import { AdminNotificationService } from './admin-notification.service';
import { AdminNotificationRepository } from './admin-notification.repository';

@Module({
    controllers: [AdminNotificationController],
    providers: [AdminNotificationService, AdminNotificationRepository],
    exports: [AdminNotificationService],
})
export class AdminNotificationModule {}
