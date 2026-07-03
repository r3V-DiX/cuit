// libs/common/filters/validation-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLogger } from '@cykruit/logger';
import { RequestContextService } from '@cykruit/context';
import { ResponseBuilder } from '../utils/response-builder.util';
import { ErrorCodes } from '../enums/error-codes';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
    constructor(
        private readonly logger: AppLogger,
        private readonly contextService: RequestContextService,
        private readonly responseBuilder: ResponseBuilder,
    ) { }

    catch(exception: BadRequestException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const body = exception.getResponse() as any;

        const errors = this.parseErrors(body);
        const ctx2 = this.contextService.getContext();

        this.logger.warn(
            `Validation Error: ${request.method} ${request.url} | ${errors.length} error(s) | User: ${ctx2?.userId || 'anonymous'}`,
            'ValidationFilter',
        );

        const errorResponse = this.responseBuilder.error(
            ErrorCodes.VALIDATION_ERROR,
            'Validation failed',
            status,
            request.url,
            errors,
        );

        response.status(status).json(errorResponse);
    }

    private parseErrors(body: any): any[] {
        const errors: any[] = [];

        if (Array.isArray(body.message)) {
            body.message.forEach((msg: string | any) => {
                if (typeof msg === 'string') {
                    errors.push({ field: this.extractField(msg), message: msg, constraint: 'validation' });
                } else if (msg?.property) {
                    Object.entries(msg.constraints || {}).forEach(([key, val]) => {
                        errors.push({ field: msg.property, message: val, constraint: key, value: msg.value });
                    });
                }
            });
        } else if (typeof body.message === 'string') {
            errors.push({ field: this.extractField(body.message), message: body.message, constraint: 'validation' });
        }

        return errors.length > 0
            ? errors
            : [{ field: 'unknown', message: 'Validation failed', constraint: 'validation' }];
    }

    private extractField(message: string): string {
        const match = message.match(/^(\w+)\s/);
        return match ? match[1] : 'unknown';
    }
}