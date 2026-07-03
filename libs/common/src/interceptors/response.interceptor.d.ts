import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ResponseBuilder } from '../utils/response-builder.util';
export declare class ResponseInterceptor implements NestInterceptor {
    private readonly responseBuilder;
    constructor(responseBuilder: ResponseBuilder);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private isMessageOnly;
    private isWarningOnly;
    private isWarningResponse;
    private isInfoResponse;
    private isRawObjectWithInfo;
    private isMessageResponse;
}
