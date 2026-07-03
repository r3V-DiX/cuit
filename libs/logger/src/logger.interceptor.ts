// libs/logger/logger.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AppLogger } from "./logger.service";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `${method} ${url} | ${statusCode} | ${duration}ms`,
            "HTTP",
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          if (statusCode >= 500) {
            // 5xx — log with short stack, no full file paths
            const shortStack = error.stack?.split("\n").slice(0, 2).join(" ");
            this.logger.error(
              `${method} ${url} | ${statusCode} | ${duration}ms | ${error.message}`,
              shortStack,
              "HTTP",
            );
          } else {
            // 4xx — just the message, no stack
            this.logger.warn(
              `${method} ${url} | ${statusCode} | ${duration}ms | ${error.message}`,
              "HTTP",
            );
          }
        },
      }),
    );
  }
}
