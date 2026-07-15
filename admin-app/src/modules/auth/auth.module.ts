// admin-app/src/modules/auth/auth.module.ts
// Console auth is self-contained (Admin + AdminSession via AdminAuthGuard).
// @Global so AdminAuthGuard resolves in every feature controller's @UseGuards.
// CsrfGuard (for the login controller) + audit loggers come from the @Global CoreModule.

import { Global, Module } from '@nestjs/common';

import { AdminAuthController } from './admin-auth.controller';
import { MeController } from './me.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';

@Global()
@Module({
    controllers: [AdminAuthController, MeController],
    providers: [AdminAuthService, AdminAuthGuard],
    exports: [AdminAuthService, AdminAuthGuard],
})
export class AuthModule {}
