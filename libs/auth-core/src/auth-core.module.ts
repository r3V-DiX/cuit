// libs/auth-core/src/auth-core.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { SESSION_VALIDATOR, ISessionValidator } from './session-validator.interface';

export interface AuthCoreModuleOptions {
    sessionValidatorClass: new (...args: any[]) => ISessionValidator;
    imports?: any[];
    enableCsrf?: boolean; // when true, registers CsrfGuard as APP_GUARD for the whole service
}

@Module({})
export class AuthCoreModule {
    static forRoot(options: AuthCoreModuleOptions): DynamicModule {
        const csrfProviders = options.enableCsrf
            ? [
                CsrfGuard,
                {
                    provide: APP_GUARD,
                    useClass: CsrfGuard,
                },
            ]
            : [
                // Always provide CsrfGuard so it can be injected
                // (e.g. AuthController needs it to call generateToken())
                // but don't register as APP_GUARD if enableCsrf is false
                CsrfGuard,
            ];

        return {
            module: AuthCoreModule,
            imports: [ConfigModule, ...(options.imports || [])],
            providers: [
                {
                    provide: SESSION_VALIDATOR,
                    useClass: options.sessionValidatorClass,
                },
                AuthGuard,
                OptionalAuthGuard,
                RolesGuard,
                ...csrfProviders,
            ],
            exports: [
                SESSION_VALIDATOR,
                AuthGuard,
                OptionalAuthGuard,
                RolesGuard,
                CsrfGuard, // always exported so controllers can inject it
            ],
        };
    }
}