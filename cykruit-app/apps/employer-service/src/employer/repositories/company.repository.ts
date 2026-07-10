// apps/employer-service/src/employer/repositories/company.repository.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmployerMemberRole } from '@prisma/client';

@Injectable()
export class CompanyRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByMemberId(userId: string) {
        const member = await this.prisma.employerMember.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' },
            include: {
                employer: {
                    include: {
                        members: true,
                        verifications: {
                            where: { isLatest: true },
                            orderBy: { submittedAt: 'desc' },
                            take: 1,
                        },
                        officeLocations: true,
                        benefits: true,
                    },
                },
            },
        });
        return member?.employer ?? null;
    }

    async findById(id: string) {
        return this.prisma.employer.findUnique({
            where: { id },
            include: {
                members: true,
                verifications: {
                    orderBy: { submittedAt: 'desc' },
                },
                officeLocations: true,
                benefits: true,
                teamMembers: true,
                companyMedia: true,
                settings: true,
            },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.employer.findUnique({ where: { slug } });
    }

    async create(userId: string, data: {
        companyName: string;
        companyType: any;
        industry: any;
        companySize: any;
        location: string;
        slug: string;
        companyWebsite?: string;
        contactEmail?: string;
    }) {
        return this.prisma.employer.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    async update(id: string, data: Record<string, any>) {
        return this.prisma.employer.update({ where: { id }, data });
    }

    async updateCompletion(id: string, percentage: number) {
        return this.prisma.employer.update({
            where: { id },
            data: { profileCompletion: percentage },
        });
    }

    async addMember(
        employerId: string,
        userId: string,
        role: EmployerMemberRole,
        invitedBy?: string,
    ) {
        return this.prisma.employerMember.create({
            data: { employerId, userId, role, ...(invitedBy ? { invitedBy } : {}) },
        });
    }

    async findMember(employerId: string, userId: string) {
        return this.prisma.employerMember.findUnique({
            where: { employerId_userId: { employerId, userId } },
        });
    }

    async upsertOfficeLocation(
        employerId: string,
        data: {
            type: string;
            address: string;
            city: string;
            state: string;
            country: string;
            isHeadquarters: boolean;
        },
    ) {
        return this.prisma.officeLocation.create({
            data: { employerId, ...data },
        });
    }

    async deleteOfficeLocation(id: string, employerId: string) {
        return this.prisma.officeLocation.deleteMany({
            where: { id, employerId },
        });
    }

    async addBenefit(
        employerId: string,
        data: { title: string; description: string; icon?: string },
    ) {
        return this.prisma.companyBenefit.create({
            data: { employerId, ...data },
        });
    }

    async deleteBenefit(id: string, employerId: string) {
        return this.prisma.companyBenefit.deleteMany({
            where: { id, employerId },
        });
    }
}
