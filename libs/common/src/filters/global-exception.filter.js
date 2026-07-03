"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
// libs/common/filters/global-exception.filter.ts
const common_1 = require("@nestjs/common");
const logger_1 = require("@cykruit/logger");
const context_1 = require("@cykruit/context");
const response_builder_util_1 = require("../utils/response-builder.util");
const error_codes_1 = require("../enums/error-codes");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    constructor(logger, contextService, responseBuilder) {
        this.logger = logger;
        this.contextService = contextService;
        this.responseBuilder = responseBuilder;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestContext = this.contextService.getContext();
        let status;
        let errorCode;
        let message;
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === "string") {
                message = exceptionResponse;
                errorCode = this.statusToCode(status);
            }
            else if (typeof exceptionResponse === "object") {
                const obj = exceptionResponse;
                if (Array.isArray(obj.message)) {
                    message = "Validation failed";
                    errorCode = error_codes_1.ErrorCodes.VALIDATION_ERROR;
                    details = this.formatValidationErrors(obj.message);
                }
                else if (obj.code) {
                    errorCode = obj.code;
                    message = obj.message || (0, error_codes_1.getErrorDescription)(errorCode);
                    details = obj.details;
                }
                else if (obj.message) {
                    message = Array.isArray(obj.message) ? obj.message[0] : obj.message;
                    errorCode =
                        this.extractCodeFromMessage(message) ||
                            obj.error ||
                            this.statusToCode(status);
                    if (obj.details)
                        details = obj.details;
                }
                else {
                    message = obj.error || "An error occurred";
                    errorCode = this.statusToCode(status);
                }
            }
            else {
                message = "An error occurred";
                errorCode = this.statusToCode(status);
            }
        }
        else if (this.isPrismaError(exception)) {
            const prismaResult = this.handlePrismaError(exception);
            status = prismaResult.status;
            errorCode = prismaResult.code;
            message = prismaResult.message;
            details = prismaResult.details;
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            errorCode = error_codes_1.ErrorCodes.INTERNAL_SERVER_ERROR;
            message = "An unexpected error occurred. Please try again.";
            this.logger.error(`Unexpected error: ${exception instanceof Error ? exception.message : "Unknown"}`, exception instanceof Error
                ? exception.stack?.split("\n").slice(0, 2).join(" ")
                : undefined, "GlobalExceptionFilter");
        }
        const logMsg = `${request.method} ${request.url} | ${status} ${errorCode} | ${message}` +
            (requestContext?.userId ? ` | User: ${requestContext.userId}` : "");
        if (status >= 500) {
            // ✅ Only first 2 lines of stack — no file paths in logs
            const shortStack = exception instanceof Error
                ? exception.stack?.split("\n").slice(0, 2).join(" ")
                : undefined;
            this.logger.error(logMsg, shortStack, "HTTP");
        }
        else if (status >= 400) {
            this.logger.warn(logMsg, "HTTP");
        }
        const errorResponse = this.responseBuilder.error(errorCode, message, status, request.url, details);
        response.status(status).json(errorResponse);
    }
    statusToCode(status) {
        const map = {
            400: error_codes_1.ErrorCodes.BAD_REQUEST,
            401: error_codes_1.ErrorCodes.UNAUTHORIZED,
            403: error_codes_1.ErrorCodes.FORBIDDEN,
            404: error_codes_1.ErrorCodes.NOT_FOUND,
            408: error_codes_1.ErrorCodes.REQUEST_TIMEOUT,
            409: error_codes_1.ErrorCodes.CONFLICT,
            422: error_codes_1.ErrorCodes.UNPROCESSABLE_ENTITY,
            429: error_codes_1.ErrorCodes.TOO_MANY_REQUESTS,
            500: error_codes_1.ErrorCodes.INTERNAL_SERVER_ERROR,
            502: error_codes_1.ErrorCodes.BAD_GATEWAY,
            503: error_codes_1.ErrorCodes.SERVICE_UNAVAILABLE,
            504: error_codes_1.ErrorCodes.GATEWAY_TIMEOUT,
        };
        return map[status] || error_codes_1.ErrorCodes.INTERNAL_SERVER_ERROR;
    }
    extractCodeFromMessage(message) {
        const allCodes = Object.values(error_codes_1.ErrorCodes);
        return allCodes.includes(message) ? message : null;
    }
    formatValidationErrors(messages) {
        return messages.map((msg) => ({
            field: this.extractField(msg),
            message: msg,
            constraint: this.extractConstraint(msg),
        }));
    }
    extractField(message) {
        const match = message.match(/^(\w+)\s/);
        return match ? match[1] : "unknown";
    }
    extractConstraint(message) {
        const map = {
            "must be a valid email": "isEmail",
            "must be a string": "isString",
            "must be a number": "isNumber",
            "should not be empty": "isNotEmpty",
            "must be longer than": "minLength",
            "must be shorter than": "maxLength",
        };
        for (const [key, val] of Object.entries(map)) {
            if (message.includes(key))
                return val;
        }
        return undefined;
    }
    isPrismaError(exception) {
        return [
            "PrismaClientKnownRequestError",
            "PrismaClientValidationError",
            "PrismaClientInitializationError",
        ].includes(exception?.name);
    }
    handlePrismaError(exception) {
        // ✅ PrismaClientValidationError has no .code — handle separately
        // This happens when wrong data types or null values are passed to Prisma
        if (exception.name === "PrismaClientValidationError") {
            this.logger.error("Prisma validation error", exception.stack?.split("\n").slice(0, 2).join(" "), "PrismaError");
            return {
                status: 400,
                code: error_codes_1.ErrorCodes.BAD_REQUEST,
                message: "Invalid data provided.",
                details: undefined,
            };
        }
        // ✅ PrismaClientInitializationError — DB connection issue at startup
        if (exception.name === "PrismaClientInitializationError") {
            this.logger.error("Prisma initialization error", exception.stack?.split("\n").slice(0, 2).join(" "), "PrismaError");
            return {
                status: 503,
                code: error_codes_1.ErrorCodes.DATABASE_CONNECTION_FAILED,
                message: "Database connection failed. Please try again later.",
                details: undefined,
            };
        }
        switch (exception.code) {
            case "P2002":
                return {
                    status: 409,
                    code: error_codes_1.ErrorCodes.DUPLICATE_ENTRY,
                    message: "A record with this value already exists",
                    details: { fields: exception.meta?.target },
                };
            case "P2003":
                return {
                    status: 400,
                    code: error_codes_1.ErrorCodes.FOREIGN_KEY_CONSTRAINT,
                    message: "Referenced record does not exist",
                    details: undefined,
                };
            case "P2025":
                return {
                    status: 404,
                    code: error_codes_1.ErrorCodes.NOT_FOUND,
                    message: "Record not found",
                    details: undefined,
                };
            case "P2024":
                return {
                    status: 408,
                    code: error_codes_1.ErrorCodes.QUERY_TIMEOUT,
                    message: "Database query timeout. Please try again.",
                    details: undefined,
                };
            case "P1001":
            case "P1002":
                return {
                    status: 503,
                    code: error_codes_1.ErrorCodes.DATABASE_CONNECTION_FAILED,
                    message: "Database connection failed. Please try again later.",
                    details: undefined,
                };
            default:
                // ✅ Never expose raw Prisma error messages to client
                this.logger.error(`Unhandled Prisma error: ${exception.code}`, exception.stack?.split("\n").slice(0, 2).join(" "), "PrismaError");
                return {
                    status: 500,
                    code: error_codes_1.ErrorCodes.INTERNAL_SERVER_ERROR,
                    message: "An unexpected database error occurred. Please try again.",
                    details: undefined,
                };
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [logger_1.AppLogger,
        context_1.RequestContextService,
        response_builder_util_1.ResponseBuilder])
], GlobalExceptionFilter);
