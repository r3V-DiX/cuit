// libs/common/src/index.ts

// Module
export { CommonModule } from './common.module';

// Types
export * from './types/response.types';

// Enums
export * from './enums/error-codes';

// Utils
export { ResponseBuilder } from './utils/response-builder.util';
export { isBlockedEmailDomain, getEmailDomain } from './utils/email-domain.util';

// Services
export { HashService } from './services/hash.service';
export { TokenService } from './services/token.service';
export { EmployerCompletionService } from './services/employer-completion.service';

// Filters
export { GlobalExceptionFilter } from './filters/global-exception.filter';
export { ValidationExceptionFilter } from './filters/validation-exception.filter';

// Interceptors
export { ResponseInterceptor } from './interceptors/response.interceptor';
export { TimeoutInterceptor } from './interceptors/timeout.interceptor';

// Interfaces
export { IRequestContext, IRequestUser } from './interfaces/request-context.interface';

export { SanitizationPipe } from "./pipes/sanitization.pipe"

export { JobSeekerCompletionService } from './services/job-seeker-completion.service';
export type { JobSeekerCompletionResult, JobSeekerCompletionSections } from './services/job-seeker-completion.service';