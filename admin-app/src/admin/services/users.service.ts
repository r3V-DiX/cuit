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
            adminId,
            action: 'users:suspend',
            module: 'users',
            resource: 'User',
            resourceId: id,
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
            adminId,
            action: 'users:unsuspend',
            module: 'users',
            resource: 'User',
            resourceId: id,
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

    async delete(id: string, adminId: string) {
        const user = await this.getById(id);
        if (user.status === AccountStatus.DELETED) {
            throw new BadRequestException('User is already deleted');
        }

        const updated = await this.usersRepository.softDelete(id);

        this.auditLogger.log({
            adminId,
            action: 'users:delete',
            module: 'users',
            resource: 'User',
            resourceId: id,
            riskLevel: 'CRITICAL',
            result: 'SUCCESS',
        });

        return updated;
    }

    async verifyEmail(id: string, adminId: string) {
        const user = await this.getById(id);
        if (user.isEmailVerified) {
            throw new BadRequestException('User email is already verified');
        }

        const updated = await this.usersRepository.verifyEmail(id);

        this.auditLogger.log({
            adminId,
            action: 'users:verify-email',
            module: 'users',
            resource: 'User',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return updated;
    }

    async unlock(id: string, adminId: string) {
        const user = await this.getById(id);
        if (!user.lockedUntil && user.failedLoginAttempts === 0) {
            throw new BadRequestException('User is not locked');
        }

        const updated = await this.usersRepository.unlock(id);

        this.auditLogger.log({
            adminId,
            action: 'users:unlock',
            module: 'users',
            resource: 'User',
            resourceId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        return updated;
    }
}
