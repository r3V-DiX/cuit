import { Module } from '@nestjs/common';
import { EmployerRbacController } from './employer-rbac.controller';
import { EmployerRbacService } from './employer-rbac.service';
import { EmployerRbacRepository } from './employer-rbac.repository';

@Module({
    controllers: [EmployerRbacController],
    providers: [EmployerRbacService, EmployerRbacRepository],
})
export class EmployerRbacModule {}
