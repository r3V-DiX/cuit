import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppLogger } from "@cykruit/logger";
import { LoggerInterceptor } from "@cykruit/logger";
import {
  GlobalExceptionFilter,
  ValidationExceptionFilter,
  SanitizationPipe,
} from "@cykruit/common";
import { ResponseInterceptor, TimeoutInterceptor } from "@cykruit/common";
import { RequestContextService } from "@cykruit/context";
import { ResponseBuilder } from "@cykruit/common";
import {
  ValidationPipe,
  BadRequestException,
  ValidationError,
} from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import express from "express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const result: string[] = [];
  for (const err of errors) {
    if (err.constraints) result.push(...Object.values(err.constraints));
    if (err.children?.length)
      result.push(...flattenValidationErrors(err.children));
  }
  return result;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: false,
  });

  const logger = app.get(AppLogger);
  const contextService = app.get(RequestContextService);
  const responseBuilder = app.get(ResponseBuilder);

  app.useLogger(logger);

  app.use((req, res, next) => {
    res.removeHeader("X-Powered-By");
    next();
  });
  app.use(helmet({ frameguard: { action: "deny" }, noSniff: true }));

  // Set global prefix to /public
  app.setGlobalPrefix("public");

  const allowedOrigins =
    process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];

  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push(
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:4001",
      "http://localhost:4002",
      "http://localhost:4003",
      "http://localhost:4006",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:4001",
      "http://127.0.0.1:4002",
      "http://127.0.0.1:4003",
      "http://127.0.0.1:4006",
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Accept",
      "x-csrf-token",
    ],
    exposedHeaders: ["Set-Cookie"],
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(compression());

  // Sanitize first, then validate
  app.useGlobalPipes(
    new SanitizationPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors: ValidationError[] = []) =>
        new BadRequestException(flattenValidationErrors(errors)),
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

  process.on("SIGTERM", async () => {
    await app.close();
    process.exit(0);
  });
  process.on("SIGINT", async () => {
    await app.close();
    process.exit(0);
  });

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Public Service")
      .setDescription("The Cykruit Public Service API description")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = process.env.PUBLIC_PORT || 4006;
  const host = process.env.HOST || "0.0.0.0";

  await app.listen(port, host);
  logger.log(
    `🚀 Public Service running on http://${host}:${port}/public`,
    "Bootstrap",
  );
  logger.log(
    `📝 Environment: ${process.env.NODE_ENV || "development"}`,
    "Bootstrap",
  );
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start public-service:", error);
  process.exit(1);
});
