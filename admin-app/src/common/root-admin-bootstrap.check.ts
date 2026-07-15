// admin-app/src/common/root-admin-bootstrap.check.ts
// Every root-admin protection in RbacService/AdminsService (see
// rbac/protected-admin.util.ts) is gated on RBAC_BOOTSTRAP_ADMIN_EMAIL resolving to
// a real, active admin. If it's unset or stale, those guards silently no-op — warn
// loudly at boot so that misconfiguration doesn't fail silently.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@cykruit/prisma';

@Injectable()
export class RootAdminBootstrapCheck implements OnModuleInit {
    private readonly logger = new Logger(RootAdminBootstrapCheck.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {}

    async onModuleInit(): Promise<void> {
        const email = this.configService.get<string>('RBAC_BOOTSTRAP_ADMIN_EMAIL');

        if (!email) {
            this.logger.error(
                'RBAC_BOOTSTRAP_ADMIN_EMAIL is not set — no admin account is protected from ' +
                    'role/permission takeover by another super_admin.',
            );
            return;
        }

        const admin = await this.prisma.admin.findUnique({
            where: { email },
            select: { isActive: true },
        });

        if (!admin) {
            this.logger.warn(
                `RBAC_BOOTSTRAP_ADMIN_EMAIL is set to "${email}" but no matching admin exists — ` +
                    'root-admin protection is inactive.',
            );
        } else if (!admin.isActive) {
            this.logger.warn(
                `RBAC_BOOTSTRAP_ADMIN_EMAIL "${email}" resolves to a deactivated admin — ` +
                    'root-admin protection is inactive.',
            );
        }
    }
}
