import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from './logger.service';
export declare class LoggerMiddleware implements NestMiddleware {
    private readonly logger;
    constructor(logger: AppLogger);
    use(req: Request, res: Response, next: NextFunction): void;
}
