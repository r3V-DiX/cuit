import { DynamicModule } from '@nestjs/common';
import { ISessionValidator } from './session-validator.interface';
export interface AuthCoreModuleOptions {
    sessionValidatorClass: new (...args: any[]) => ISessionValidator;
    imports?: any[];
    enableCsrf?: boolean;
}
export declare class AuthCoreModule {
    static forRoot(options: AuthCoreModuleOptions): DynamicModule;
}
