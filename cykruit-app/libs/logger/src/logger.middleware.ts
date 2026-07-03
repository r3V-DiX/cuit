// libs/logger/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(private readonly logger: AppLogger) { }

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const startTime = Date.now();

        this.logger.logRequest(method, originalUrl);

        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            this.logger.logRequest(method, originalUrl, res.statusCode, responseTime);

            if (responseTime > 1000) {
                this.logger.warn(
                    `Slow request: ${method} ${originalUrl} took ${responseTime}ms`,
                    'Performance',
                );
            }
        });

        next();
    }
}