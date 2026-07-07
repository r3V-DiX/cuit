// admin-app/src/admin/services/kyc.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { KycRepository } from '../repositories/kyc.repository';
import { KycListQueryDto, ApproveKycDto, RejectKycDto } from '../dto/kyc.dto';
import { AdminAuditLogger } from './admin-audit.logger';
import { EventPublisher, DomainEventType } from '@cykruit/events';
import { PrismaService } from '@cykruit/prisma';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class KycService {
    constructor(
        private readonly kycRepository: KycRepository,
        private readonly auditLogger: AdminAuditLogger,
        private readonly eventPublisher: EventPublisher,
        private readonly prisma: PrismaService,
    ) {}

    async list(query: KycListQueryDto) {
        return this.kycRepository.findAll(query);
    }

    async getById(id: string) {
        const record = await this.kycRepository.findById(id);
        if (!record) throw new NotFoundException('KYC record not found');
        return record;
    }

    async approve(id: string, adminId: string, dto: ApproveKycDto) {
        const record = await this.getById(id);

        if (record.status === VerificationStatus.APPROVED) {
            throw new BadRequestException('Already approved');
        }

        const updated = await this.kycRepository.approveWithTransaction(id, record.employerId, adminId, dto.adminNotes);

        this.auditLogger.log({
            actorId: adminId,
            action: 'company:approve_kyc',
            module: 'kyc',
            targetType: 'EmployerVerification',
            targetId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        const owner = await this.prisma.employerMember.findFirst({
            where: { employerId: record.employerId, role: 'OWNER' },
            select: { userId: true },
        });
        if (owner) {
            this.eventPublisher.publish(
                DomainEventType.KYC_APPROVED,
                {
                    verificationId: id,
                    employerId: record.employerId,
                    employerUserId: owner.userId,
                    companyName: record.employer.companyName,
                },
                'admin-app',
            );
        }

        return updated;
    }

    async reject(id: string, adminId: string, dto: RejectKycDto) {
        const record = await this.getById(id);

        if (record.status === VerificationStatus.REJECTED) {
            throw new BadRequestException('Already rejected');
        }

        const updated = await this.kycRepository.rejectWithTransaction(
            id,
            record.employerId,
            adminId,
            dto.rejectionReason,
            dto.adminNotes,
            record.status === VerificationStatus.APPROVED,
        );

        this.auditLogger.log({
            actorId: adminId,
            action: 'company:reject_kyc',
            module: 'kyc',
            targetType: 'EmployerVerification',
            targetId: id,
            riskLevel: 'MEDIUM',
            result: 'SUCCESS',
        });

        const owner = await this.prisma.employerMember.findFirst({
            where: { employerId: record.employerId, role: 'OWNER' },
            select: { userId: true },
        });
        if (owner) {
            this.eventPublisher.publish(
                DomainEventType.KYC_REJECTED,
                {
                    verificationId: id,
                    employerId: record.employerId,
                    employerUserId: owner.userId,
                    companyName: record.employer.companyName,
                    rejectionReason: dto.rejectionReason,
                },
                'admin-app',
            );
        }

        return updated;
    }
}
