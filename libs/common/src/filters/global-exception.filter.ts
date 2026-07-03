// libs/common/filters/global-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLogger } from '@cykruit/logger';
import { RequestContextService } from '@cykruit/context';
import { ResponseBuilder } from '../utils/response-builder.util';
import { ErrorCodes, getErrorDescription } from '../enums/error-codes';
import { IValidationError } from '../types/response.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly logger: AppLogger,
        private readonly contextService: RequestContextService,
        private readonly responseBuilder: ResponseBuilder,
    ) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const requestContext = this.contextService.getContext();

        let status: number;
        let errorCode: string;
        let message: string;
        let details: any = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                errorCode = this.statusToCode(status);
            } else if (typeof exceptionResponse === 'object') {
                const obj = exceptionResponse as any;

                if (Array.isArray(obj.message)) {
                    message = 'Validation failed';
                    errorCode = ErrorCodes.VALIDATION_ERROR;
                    details = this.formatValidationErrors(obj.message);
                } else if (obj.code) {
                    errorCode = obj.code;
                    message = obj.message || getErrorDescription(errorCode);
                    details = obj.details;
                } else if (obj.message) {
                    message = Array.isArray(obj.message) ? obj.message[0] : obj.message;
                    errorCode = this.extractCodeFromMessage(message) || obj.error || this.statusToCode(status);
                    if (obj.details) details = obj.details;
                } else {
                    message = obj.error || 'An error occurred';
                    errorCode = this.statusToCode(status);
                }
            } else {
                message = 'An error occurred';
                errorCode = this.statusToCode(status);
            }
        } else if (this.isPrismaError(exception)) {
            const prismaResult = this.handlePrismaError(exception as any);
            status = prismaResult.status;
            errorCode = prismaResult.code;
            message = prismaResult.message;
            details = prismaResult.details;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
            message = 'An unexpected error occurred. Please try again.';

            this.logger.error(
                `Unexpected error: ${exception instanceof Error ? exception.message : 'Unknown'}`,
                exception instanceof Error ? exception.stack?.split('\n').slice(0, 2).join(' ') : undefined,
                'GlobalExceptionFilter',
            );
        }

        const logMsg = `${request.method} ${request.url} | ${status} ${errorCode} | ${message}`
            + (requestContext?.userId ? ` | User: ${requestContext.userId}` : '');

        if (status >= 500) {
            // ✅ Only first 2 lines of stack — no file paths in logs
            const shortStack = exception instanceof Error
                ? exception.stack?.split('\n').slice(0, 2).join(' ')
                : undefined;
            this.logger.error(logMsg, shortStack, 'HTTP');
        } else if (status >= 400) {
            this.logger.warn(logMsg, 'HTTP');
        }

        const errorResponse = this.responseBuilder.error(errorCode, message, status, request.url, details);
        response.status(status).json(errorResponse);
    }

    private statusToCode(status: number): string {
        const map: Record<number, string> = {
            400: ErrorCodes.BAD_REQUEST,
            401: ErrorCodes.UNAUTHORIZED,
            403: ErrorCodes.FORBIDDEN,
            404: ErrorCodes.NOT_FOUND,
            408: ErrorCodes.REQUEST_TIMEOUT,
            409: ErrorCodes.CONFLICT,
            422: ErrorCodes.UNPROCESSABLE_ENTITY,
            429: ErrorCodes.TOO_MANY_REQUESTS,
            500: ErrorCodes.INTERNAL_SERVER_ERROR,
            502: ErrorCodes.BAD_GATEWAY,
            503: ErrorCodes.SERVICE_UNAVAILABLE,
            504: ErrorCodes.GATEWAY_TIMEOUT,
        };
        return map[status] || ErrorCodes.INTERNAL_SERVER_ERROR;
    }

    private extractCodeFromMessage(message: string): string | null {
        const allCodes = Object.values(ErrorCodes);
        return allCodes.includes(message as any) ? message : null;
    }

    private formatValidationErrors(messages: string[]): IValidationError[] {
        return messages.map((msg) => ({
            field: this.extractField(msg),
            message: msg,
            constraint: this.extractConstraint(msg),
        }));
    }

    private extractField(message: string): string {
        const match = message.match(/^(\w+)\s/);
        return match ? match[1] : 'unknown';
    }

    private extractConstraint(message: string): string | undefined {
        const map: Record<string, string> = {
            'must be a valid email': 'isEmail',
            'must be a string': 'isString',
            'must be a number': 'isNumber',
            'should not be empty': 'isNotEmpty',
            'must be longer than': 'minLength',
            'must be shorter than': 'maxLength',
        };
        for (const [key, val] of Object.entries(map)) {
            if (message.includes(key)) return val;
        }
        return undefined;
    }

    private isPrismaError(exception: any): boolean {
        return [
            'PrismaClientKnownRequestError',
            'PrismaClientValidationError',
            'PrismaClientInitializationError',
        ].includes(exception?.name);
    }

    private handlePrismaError(exception: any) {
        // ✅ PrismaClientValidationError has no .code — handle separately
        // This happens when wrong data types or null values are passed to Prisma
        if (exception.name === 'PrismaClientValidationError') {
            this.logger.error('Prisma validation error', exception.stack?.split('\n').slice(0, 2).join(' '), 'PrismaError');
            return {
                status: 400,
                code: ErrorCodes.BAD_REQUEST,
                message: 'Invalid data provided.',
                details: undefined,
            };
        }

        // ✅ PrismaClientInitializationError — DB connection issue at startup
        if (exception.name === 'PrismaClientInitializationError') {
            this.logger.error('Prisma initialization error', exception.stack?.split('\n').slice(0, 2).join(' '), 'PrismaError');
            return {
                status: 503,
                code: ErrorCodes.DATABASE_CONNECTION_FAILED,
                message: 'Database connection failed. Please try again later.',
                details: undefined,
            };
        }

        switch (exception.code) {
            case 'P2002':
                return {
                    status: 409,
                    code: ErrorCodes.DUPLICATE_ENTRY,
                    message: 'A record with this value already exists',
                    details: { fields: exception.meta?.target },
                };
            case 'P2003':
                return {
                    status: 400,
                    code: ErrorCodes.FOREIGN_KEY_CONSTRAINT,
                    message: 'Referenced record does not exist',
                    details: undefined,
                };
            case 'P2025':
                return {
                    status: 404,
                    code: ErrorCodes.NOT_FOUND,
                    message: 'Record not found',
                    details: undefined,
                };
            case 'P2024':
                return {
                    status: 408,
                    code: ErrorCodes.QUERY_TIMEOUT,
                    message: 'Database query timeout. Please try again.',
                    details: undefined,
                };
            case 'P1001':
            case 'P1002':
                return {
                    status: 503,
                    code: ErrorCodes.DATABASE_CONNECTION_FAILED,
                    message: 'Database connection failed. Please try again later.',
                    details: undefined,
                };
            default:
                // ✅ Never expose raw Prisma error messages to client
                this.logger.error(
                    `Unhandled Prisma error: ${exception.code}`,
                    exception.stack?.split('\n').slice(0, 2).join(' '),
                    'PrismaError',
                );
                return {
                    status: 500,
                    code: ErrorCodes.INTERNAL_SERVER_ERROR,
                    message: 'An unexpected database error occurred. Please try again.',
                    details: undefined,
                };
        }
    }
}