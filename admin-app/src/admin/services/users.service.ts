// admin-app/src/admin/services/users.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { AdminUserListQueryDto, SuspendUserDto, UnsuspendUserDto } from '../dto/users.dto';
import { AdminAuditLogger } from './admin-audit.logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly eventPublisher: EventPublisher,
    ) {}

    async list(query: AdminUserListQueryDto) {
        return this.usersRepository.findAll(query);
    }

    async getById(id: string) {
        const user = await this.usersRepository.findById(id);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async suspend(id: string, adminId: string, dto: SuspendUserDto) {
        const user = await this.getById(id);

        if (user.status === AccountStatus.SUSPENDED) {
            throw new BadRequestException('User already suspended');
        }

        if (user.status === AccountStatus.DELETED) {
            throw new BadRequestException('Cannot suspend deleted user');
        }

        const updated = await this.usersRepository.suspend(id);

        this.auditLogger.log({
            actorId: adminId,
            action: 'users:suspend',
            module: 'users',
            targetType: 'User',
            targetId: id,
            riskLevel: 'HIGH',
            result: 'SUCCESS',
            newData: { reason: dto.reason },
        });

        this.eventPublisher.publish(
            DomainEventType.ACCOUNT_SUSPENDED,
            {
                userId: id,
                reason: dto.reason,
                suspendedBy: adminId,
            },
            'admin-app',
        );

        return updated;
    }

    async unsuspend(id: string, adminId: string, dto: UnsuspendUserDto) {
        const user = await this.getById(id);

        if (user.status !== AccountStatus.SUSPENDED) {
            throw new BadRequestException('User is not suspended');
        }

        const updated = await this.usersRepository.unsuspend(id);

        this.auditLogger.log({
            actorId: adminId,
            action: 'users:unsuspend',
            module: 'users',
            targetType: 'User',
            targetId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
            newData: { action: 'unsuspend', reason: dto.reason },
        });

        this.eventPublisher.publish(
            DomainEventType.ACCOUNT_UNSUSPENDED,
            {
                userId: id,
                unsuspendedBy: adminId,
            },
            'admin-app',
        );

        return updated;
    }
}
