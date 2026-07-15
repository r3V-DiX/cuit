import { Module } from '@nestjs/common';
import { AdminsController } from './admins.controller';
import { AdminInviteAcceptController } from './admin-invite-accept.controller';
import { AdminsService } from './admins.service';
import { AdminsRepository } from './admins.repository';

@Module({
    controllers: [AdminsController, AdminInviteAcceptController],
    providers: [AdminsService, AdminsRepository],
})
export class AdminsModule {}
