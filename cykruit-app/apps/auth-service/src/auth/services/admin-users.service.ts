// apps/auth-service/src/auth/services/admin-users.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { AuditService } from '@cykruit/audit';
import { UserRole, AccountStatus } from '@prisma/client';
import { AdminUserQueryDto } from '../dto/admin-users.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  isEmailVerified: true,
  lastLogin: true,
  createdAt: true,
  profileImage: true,
} as const;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(query: AdminUserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Parameters<typeof this.prisma.user.findMany>[0]['where'] = {};

    if (query.role) {
      where.role = query.role as UserRole;
    }

    if (query.status) {
      where.status = query.status as AccountStatus;
    }

    if (query.q) {
      const term = query.q.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        employer: {
          select: {
            id: true,
            companyName: true,
            isVerified: true,
          },
        },
        jobSeekerProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async suspendUser(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new BadRequestException('User is already suspended');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin accounts cannot be suspended');
    }

    const oldStatus = user.status;

    await this.prisma.user.update({
      where: { id },
      data: { status: AccountStatus.SUSPENDED },
    });

    await this.auditService.logAction({
      actorId,
      actorRole: 'ADMIN',
      action: 'users:suspend',
      module: 'USERS',
      targetType: 'User',
      targetId: id,
      riskLevel: 'HIGH',
      result: 'SUCCESS',
      oldData: { status: oldStatus },
      newData: { status: AccountStatus.SUSPENDED },
    });
  }

  async unsuspendUser(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true, role: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (user.status !== AccountStatus.SUSPENDED) {
      throw new BadRequestException('User is not suspended');
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: AccountStatus.ACTIVE },
    });

    await this.auditService.logAction({
      actorId,
      actorRole: 'ADMIN',
      action: 'users:unsuspend',
      module: 'USERS',
      targetType: 'User',
      targetId: id,
      riskLevel: 'MEDIUM',
      result: 'SUCCESS',
      oldData: { status: AccountStatus.SUSPENDED },
      newData: { status: AccountStatus.ACTIVE },
    });
  }
}
