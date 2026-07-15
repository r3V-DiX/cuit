// admin-app/src/modules/admin.module.ts
// Aggregator: wires the @Global CoreModule (shared infra + guards + loggers) and
// AuthModule once, then every feature module. Feature modules are self-contained;
// their cross-cutting deps resolve through Core's global exports.

import { Module } from '@nestjs/common';

import { CoreModule } from '../common/core.module';
import { AuthModule } from './auth';
import { KycModule } from './kyc';
import { JobsModule } from './jobs';
import { UsersModule } from './users';
import { RbacModule } from './rbac';
import { SubscriptionModule } from './subscription';
import { AuditModule } from './audit';
import { DashboardModule } from './dashboard';
import { TestimonialsModule } from './testimonials';
import { DiscountsModule } from './discounts';
import { AdminsModule } from './admins';
import { ContactModule } from './contact';
import { SettingsModule } from './settings';
import { ReportsModule } from './reports';

@Module({
    imports: [
        CoreModule,
        AuthModule,
        KycModule,
        JobsModule,
        UsersModule,
        RbacModule,
        SubscriptionModule,
        AuditModule,
        DashboardModule,
        TestimonialsModule,
        DiscountsModule,
        AdminsModule,
        ContactModule,
        SettingsModule,
        ReportsModule,
    ],
})
export class AdminModule {}
