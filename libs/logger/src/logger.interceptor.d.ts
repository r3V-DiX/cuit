import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppLogger } from './logger.service';
export declare class LoggerInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: AppLogger);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
