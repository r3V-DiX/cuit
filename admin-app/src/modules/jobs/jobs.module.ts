import { Module } from '@nestjs/common';
import { AdminJobsController } from './jobs.controller';
import { AdminJobsService } from './jobs.service';
import { AdminJobsRepository } from './jobs.repository';

@Module({
    controllers: [AdminJobsController],
    providers: [AdminJobsService, AdminJobsRepository],
})
export class JobsModule {}
