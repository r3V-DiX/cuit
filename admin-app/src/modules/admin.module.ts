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
import { ResumesModule } from './resumes';
import { ApplicationsModule } from './applications';
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
import { PoliciesModule } from './policies';
import { AnnouncementsModule } from './announcements';
import { BlacklistModule } from './blacklist';
import { SuggestionsModule } from './suggestions';
import { ExportModule } from './export';
import { AnalyticsModule } from './analytics';
import { DomainsModule } from './domains';
import { RolesModule } from './roles';
import { SystemHealthModule } from './system-health';
import { EmailsModule } from './emails';
import { BlogsModule } from './blogs';
import { AdsModule } from './ads';
import { EventsModule } from './events';
import { SearchModule } from './search';
import { AdminNotificationModule } from './admin-notifications';

@Module({
    imports: [
        CoreModule,
        AuthModule,
        KycModule,
        JobsModule,
        UsersModule,
        ResumesModule,
        ApplicationsModule,
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
        PoliciesModule,
        AnnouncementsModule,
        BlacklistModule,
        SuggestionsModule,
        ExportModule,
        AnalyticsModule,
        DomainsModule,
        RolesModule,
        SystemHealthModule,
        EmailsModule,
        BlogsModule,
        AdsModule,
        EventsModule,
        SearchModule,
        AdminNotificationModule,
    ],
})
export class AdminModule {}
