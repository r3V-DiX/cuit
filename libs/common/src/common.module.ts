// libs/common/src/common.module.ts
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ResponseBuilder } from "./utils/response-builder.util";
import { HashService } from "./services/hash.service";
import { TokenService } from "./services/token.service";
import { EmployerCompletionService } from "./services/employer-completion.service";
import { JobSeekerCompletionService } from "./services/job-seeker-completion.service";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { ValidationExceptionFilter } from "./filters/validation-exception.filter";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { RequestContextModule } from "@cykruit/context";
import { LoggerModule } from "@cykruit/logger";
import { PrismaModule } from "@cykruit/prisma";

@Global()
@Module({
  imports: [ConfigModule, RequestContextModule, LoggerModule, PrismaModule],
  providers: [
    ResponseBuilder,
    HashService,
    TokenService,
    EmployerCompletionService,
    JobSeekerCompletionService,
    GlobalExceptionFilter,
    ValidationExceptionFilter,
    ResponseInterceptor,
  ],
  exports: [
    ResponseBuilder,
    HashService,
    TokenService,
    EmployerCompletionService,
    JobSeekerCompletionService,
    GlobalExceptionFilter,
    ValidationExceptionFilter,
    ResponseInterceptor,
  ],
})
export class CommonModule {}
