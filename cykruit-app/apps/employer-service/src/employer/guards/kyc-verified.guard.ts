// apps/employer-service/src/employer/guards/kyc-verified.guard.ts

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { CompanyRepository } from '../repositories/company.repository';

export const SKIP_KYC_CHECK_KEY = 'skipKycCheck';

/**
 * Blocks access unless the authenticated user belongs to a KYC-verified employer.
 * Must run after AuthGuard (relies on request.user being set).
 *
 * Apply @SkipKycCheck() on a handler to bypass for routes that intentionally
 * pre-date verification (e.g. accept-invite, company setup).
 */
@Injectable()
export class KycVerifiedGuard implements CanActivate {
    constructor(
        private readonly companyRepository: CompanyRepository,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_KYC_CHECK_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const user = request['user'] as User | undefined;

        if (!user) {
            throw new ForbiddenException('Authentication required before KYC check.');
        }

        const employer = await this.companyRepository.findByMemberId(user.id);
        if (!employer?.isVerified) {
            throw new ForbiddenException('Your company KYC verification is not yet approved.');
        }

        return true;
    }
}
