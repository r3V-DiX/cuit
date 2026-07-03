"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
// libs/common/src/common.module.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const response_builder_util_1 = require("./utils/response-builder.util");
const hash_service_1 = require("./services/hash.service");
const token_service_1 = require("./services/token.service");
const employer_completion_service_1 = require("./services/employer-completion.service");
const job_seeker_completion_service_1 = require("./services/job-seeker-completion.service");
const global_exception_filter_1 = require("./filters/global-exception.filter");
const validation_exception_filter_1 = require("./filters/validation-exception.filter");
const response_interceptor_1 = require("./interceptors/response.interceptor");
const context_1 = require("@cykruit/context");
const logger_1 = require("@cykruit/logger");
const prisma_1 = require("@cykruit/prisma");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, context_1.RequestContextModule, logger_1.LoggerModule, prisma_1.PrismaModule],
        providers: [
            response_builder_util_1.ResponseBuilder,
            hash_service_1.HashService,
            token_service_1.TokenService,
            employer_completion_service_1.EmployerCompletionService,
            job_seeker_completion_service_1.JobSeekerCompletionService,
            global_exception_filter_1.GlobalExceptionFilter,
            validation_exception_filter_1.ValidationExceptionFilter,
            response_interceptor_1.ResponseInterceptor,
        ],
        exports: [
            response_builder_util_1.ResponseBuilder,
            hash_service_1.HashService,
            token_service_1.TokenService,
            employer_completion_service_1.EmployerCompletionService,
            job_seeker_completion_service_1.JobSeekerCompletionService,
            global_exception_filter_1.GlobalExceptionFilter,
            validation_exception_filter_1.ValidationExceptionFilter,
            response_interceptor_1.ResponseInterceptor,
        ],
    })
], CommonModule);
