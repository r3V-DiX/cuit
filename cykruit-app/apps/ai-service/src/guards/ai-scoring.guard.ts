import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@cykruit/prisma';
import { EmployerLimitsService } from '@cykruit/subscription';

@Injectable()
export class AiScoringGuard implements CanActivate {
    constructor(
        private readonly prisma: PrismaService,
        private readonly employerLimits: EmployerLimitsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const userId: string | undefined = req.user?.id;

        if (!userId) throw new ForbiddenException('Authentication required');

        const member = await this.prisma.employerMember.findFirst({
            where: { userId },
            select: { employerId: true },
        });

        if (!member) {
            throw new ForbiddenException('Employer account required to use AI features');
        }

        const limits = await this.employerLimits.resolveForEmployer(member.employerId);

        if (!limits.aiScoringEnabled) {
            throw new ForbiddenException('AI features require a paid plan. Upgrade to unlock.');
        }

        return true;
    }
}
