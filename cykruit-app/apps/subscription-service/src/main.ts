// apps/subscription-service/src/main.ts

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { PrismaService } from '@cykruit/prisma';
import type { Redis } from 'ioredis';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { AppLogger } from '@cykruit/logger';
import { LoggerInterceptor } from '@cykruit/logger';
import { GlobalExceptionFilter, ValidationExceptionFilter } from '@cykruit/common';
import { ResponseInterceptor, TimeoutInterceptor } from '@cykruit/common';
import { RequestContextService } from '@cykruit/context';
import { ResponseBuilder } from '@cykruit/common';
import { SanitizationPipe } from '@cykruit/common';
import {
    ValidationPipe,
    BadRequestException,
    ValidationError,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

function flattenValidationErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];
    for (const err of errors) {
        if (err.constraints) {
            result.push(...Object.values(err.constraints));
        }
        if (err.children && err.children.length) {
            result.push(...flattenValidationErrors(err.children));
        }
    }
    return result;
}

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
        cors: false,
        rawBody: true,
    });

    // 2 trusted hops in prod: Nginx, then the gateway's http-proxy-middleware (xfwd).
    app.set('trust proxy', 2);

    const logger = app.get(AppLogger);
    const contextService = app.get(RequestContextService);
    const responseBuilder = app.get(ResponseBuilder);

    app.useLogger(logger);

    app.use((req, res, next) => {
        res.removeHeader('X-Powered-By');
        next();
    });

    app.use(helmet({ frameguard: { action: 'deny' }, noSniff: true }));

    const allowedOrigins =
        process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [
            'http://localhost:3000',
            'http://localhost:4000',
        ];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'x-csrf-token'],
        exposedHeaders: ['Set-Cookie'],
    });

    // Use Nest's body parsers (NOT manual express.json/urlencoded) so that
    // req.rawBody stays populated — the Razorpay webhook handler depends on it.
    // https://docs.nestjs.com/techniques/body-parsing#raw-body-support
    app.useBodyParser('json', { limit: '256kb' });
    app.useBodyParser('urlencoded', { extended: true, limit: '256kb' });
    app.use(cookieParser());
    app.use(compression());

    app.useGlobalPipes(
        new SanitizationPipe(),
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: false },
            exceptionFactory: (errors: ValidationError[] = []) => {
                const messages = flattenValidationErrors(errors);
                return new BadRequestException(messages);
            },
        }),
    );

    app.useGlobalInterceptors(new LoggerInterceptor(logger));
    app.useGlobalInterceptors(new TimeoutInterceptor(30000));
    app.useGlobalInterceptors(new ResponseInterceptor(responseBuilder));

    app.useGlobalFilters(
        new ValidationExceptionFilter(logger, contextService, responseBuilder),
    );
    app.useGlobalFilters(
        new GlobalExceptionFilter(logger, contextService, responseBuilder),
    );

    process.on('SIGTERM', async () => { await app.close(); process.exit(0); });
    process.on('SIGINT', async () => { await app.close(); process.exit(0); });

    const port = process.env.SUBSCRIPTION_PORT || 4008;
    const host = process.env.HOST || '0.0.0.0';

    // Registered before app.listen() — Nest finalizes its own routing (including
    // a catch-all 404 handler) as part of listen(), so a raw Express route added
    // afterward would never be reached; Nest's own 404 would win first.
    const httpServer = app.getHttpAdapter().getInstance() as import('express').Application;
    const prisma = app.get(PrismaService);
    const redis = app.get<Redis>(getRedisConnectionToken());
    httpServer.get('/health', async (_req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            await redis.ping();
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        } catch (err) {
            logger.error('Health check failed', String(err), 'Bootstrap'); res.status(503).json({ status: 'error' });
        }
    });

    await app.listen(port, host);

    logger.log(`🚀 Subscription Service running on http://${host}:${port}`, 'Bootstrap');
    logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}

bootstrap().catch((error) => {
    console.error('❌ Failed to start subscription service:', error);
    process.exit(1);
});
