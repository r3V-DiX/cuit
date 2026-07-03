// libs/audit/src/audit.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@cykruit/prisma';
import { LoggerModule } from '@cykruit/logger';
import { AuditService } from './audit.service';

@Global()
@Module({
    imports: [PrismaModule, LoggerModule],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule { }