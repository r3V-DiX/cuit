import { Module } from '@nestjs/common';
import { PrismaModule } from '@cykruit/prisma';
import { EmployerLimitsService } from './services/employer-limits.service';

@Module({
    imports: [PrismaModule],
    providers: [EmployerLimitsService],
    exports: [EmployerLimitsService],
})
export class SubscriptionModule {}
