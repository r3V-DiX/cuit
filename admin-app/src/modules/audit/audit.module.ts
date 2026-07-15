import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditQueryService } from './audit.service';
import { AuditRepository } from './audit.repository';

@Module({
    controllers: [AuditController],
    providers: [AuditQueryService, AuditRepository],
})
export class AuditModule {}
